#include "chdb.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_FORMAT_LENGTH 64
#define MAX_PATH_LENGTH 4096
#define MAX_ARG_COUNT 6
#define QUERY_PREFIX "--query="
#define FORMAT_PREFIX "--output-format="
#define PATH_PREFIX "--path="

// Utility function to construct argument string
// Returns 0 on success, -1 if truncated
int construct_arg(char *dest, const char *prefix, const char *value,
                  size_t dest_size) {
  if (dest == NULL || prefix == NULL || value == NULL) {
    return -1;
  }
  int written = snprintf(dest, dest_size, "%s%s", prefix, value);
  // Check if output was truncated
  if (written < 0 || (size_t)written >= dest_size) {
    return -1;
  }
  return 0;
}

// Generalized query function
char *general_query(int argc, char *args[]) {
  struct local_result *result = query_stable(argc, args);

  if (result == NULL) {
    return NULL;
  }
  
  char *buf_copy = malloc(result->len + 1);
  if (buf_copy == NULL) {
    free_result(result);
    return NULL;
  }
  memcpy(buf_copy, result->buf, result->len);
  buf_copy[result->len] = '\0';
  
  // Free the original result
  free_result(result);
  
  return buf_copy;
}

// Query function without session
char *Query(const char *query, const char *format) {
  if (query == NULL || format == NULL) {
    return NULL;
  }

  char dataFormat[MAX_FORMAT_LENGTH];
  char *dataQuery;
  char *args[MAX_ARG_COUNT] = {"clickhouse", "--multiquery", NULL, NULL};
  int argc = 4;

  // Validate format string length
  if (construct_arg(dataFormat, FORMAT_PREFIX, format, MAX_FORMAT_LENGTH) != 0) {
    return NULL;
  }
  args[2] = dataFormat;

  // Allocate memory for query argument
  size_t query_arg_len = strlen(query) + strlen(QUERY_PREFIX) + 1;
  dataQuery = malloc(query_arg_len);
  if (dataQuery == NULL) {
    return NULL;
  }
  
  if (construct_arg(dataQuery, QUERY_PREFIX, query, query_arg_len) != 0) {
    free(dataQuery);
    return NULL;
  }
  args[3] = dataQuery;

  char *result = general_query(argc, args);
  free(dataQuery);
  return result;
}

// QuerySession function will save the session to the path
// queries with same path will use the same session
char *QuerySession(const char *query, const char *format, const char *path) {
  if (query == NULL || format == NULL || path == NULL) {
    return NULL;
  }

  char dataFormat[MAX_FORMAT_LENGTH];
  char dataPath[MAX_PATH_LENGTH];
  char *dataQuery;
  char *args[MAX_ARG_COUNT] = {"clickhouse", "--multiquery", NULL, NULL, NULL};
  int argc = 5;

  // Validate format string length
  if (construct_arg(dataFormat, FORMAT_PREFIX, format, MAX_FORMAT_LENGTH) != 0) {
    return NULL;
  }
  args[2] = dataFormat;

  // Allocate memory for query argument
  size_t query_arg_len = strlen(query) + strlen(QUERY_PREFIX) + 1;
  dataQuery = malloc(query_arg_len);
  if (dataQuery == NULL) {
    return NULL;
  }
  
  if (construct_arg(dataQuery, QUERY_PREFIX, query, query_arg_len) != 0) {
    free(dataQuery);
    return NULL;
  }
  args[3] = dataQuery;

  // Validate path string length
  if (construct_arg(dataPath, PATH_PREFIX, path, MAX_PATH_LENGTH) != 0) {
    free(dataQuery);
    return NULL;
  }
  args[4] = dataPath;

  char *result = general_query(argc, args);
  free(dataQuery);
  return result;
}

// Free function for FFI callers to clean up query results
void free_cstr(char *result) {
  if (result != NULL) {
    free(result);
  }
}
