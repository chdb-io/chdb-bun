#include <stdio.h>
#include <stdlib.h>
#include "libchdb.h"
#include "libchdb_bun.h"

char *Execute(char *query, char *format) {
    char *argv[] = {(char *)"clickhouse", (char *)"--multiquery", (char *)"--output-format=CSV", (char *)"--query="};
    char dataFormat[100];
    char *localQuery;
    int argc = 4;
    struct local_result *result;

    snprintf(dataFormat, sizeof(dataFormat), "--format=%s", format);
    argv[2] = strdup(dataFormat);

    localQuery = (char *) malloc(strlen(query) + 10);
    if (localQuery == NULL) {
        return NULL;
    }

    sprintf(localQuery, "--query=%s", query);
    argv[3] = strdup(localQuery);
    free(localQuery);

    result = query_stable(argc, argv);

    free(argv[2]);
    free(argv[3]);

    if (result == NULL) {
      return NULL;
    } else {
      return result->buf;
    }
}

char *ExecuteSession(char *query, char *format, char *path) {
    char *argv[] = {(char *)"clickhouse", (char *)"--multiquery", (char *)"--output-format=CSV", (char *)"--query=", (char *)"--path=."};
    char dataFormat[100];
    char dataPath[100];
    char *localQuery;
    int argc = 5;
    struct local_result *result;

    snprintf(dataFormat, sizeof(dataFormat), "--format=%s", format);
    argv[2] = strdup(dataFormat);

    snprintf(dataPath, sizeof(dataPath), "--path=%s", path);
    argv[4] = strdup(dataPath);

    localQuery = (char *) malloc(strlen(query) + 10);
    if (localQuery == NULL) {
        return NULL;
    }

    sprintf(localQuery, "--query=%s", query);
    argv[3] = strdup(localQuery);
    free(localQuery);

    result = query_stable(argc, argv);

    free(argv[2]);
    free(argv[3]);
    free(argv[4]);

    if (result == NULL) {
      return NULL;
    } else {
      return result->buf;
    }
}
