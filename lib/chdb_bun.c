#include "chdb.h"
#include "chdb_bun.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_FORMAT_LENGTH 64
#define MAX_PATH_LENGTH 4096
#define MAX_ARG_COUNT 6

// Utility function to construct argument string
void construct_arg(char *dest, const char *prefix, const char *value,
                   size_t dest_size) {
  snprintf(dest, dest_size, "%s%s", prefix, value);
}

// Generalized query function
char *general_query(int argc, char *args[]) {
  struct local_result *result = query_stable(argc, args);

  if (result == NULL) {
    return NULL;
  } else {
    return result->buf;
  }
}

// Query function without session
char *Query(const char *query, const char *format) {
  char dataFormat[MAX_FORMAT_LENGTH];
  char *dataQuery;
  char *args[MAX_ARG_COUNT] = {"clickhouse", "--multiquery", NULL, NULL};
  int argc = 4;

  construct_arg(dataFormat, "--output-format=", format, MAX_FORMAT_LENGTH);
  args[2] = dataFormat;

  dataQuery = (char *)malloc(strlen(query) + strlen("--query=") + 1);
  if (dataQuery == NULL) {
    return NULL;
  }
  construct_arg(dataQuery, "--query=", query,
                strlen(query) + strlen("--query=") + 1);
  args[3] = dataQuery;

  char *result = general_query(argc, args);
  free(dataQuery);
  return result;
}

// QuerySession function will save the session to the path
// queries with same path will use the same session
char *QuerySession(const char *query, const char *format, const char *path) {
  char dataFormat[MAX_FORMAT_LENGTH];
  char dataPath[MAX_PATH_LENGTH];
  char *dataQuery;
  char *args[MAX_ARG_COUNT] = {"clickhouse", "--multiquery", NULL, NULL, NULL};
  int argc = 5;

  construct_arg(dataFormat, "--output-format=", format, MAX_FORMAT_LENGTH);
  args[2] = dataFormat;

  dataQuery = (char *)malloc(strlen(query) + strlen("--query=") + 1);
  if (dataQuery == NULL) {
    return NULL;
  }
  construct_arg(dataQuery, "--query=", query,
                strlen(query) + strlen("--query=") + 1);
  args[3] = dataQuery;

  construct_arg(dataPath, "--path=", path, MAX_PATH_LENGTH);
  args[4] = dataPath;

  char *result = general_query(argc, args);
  free(dataQuery);
  return result;
}
