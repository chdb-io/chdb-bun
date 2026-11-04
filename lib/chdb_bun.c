#include "chdb.h"
#include "chdb_bun.h"
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_PATH_LENGTH 4096

// libchdb binds one storage path per process and is meant to boot once. The
// deprecated query_stable() booted and tore the engine down on every call, and
// on chdb-core the second such call in a process fails ("EventNotifier is
// initialized twice"). So keep one connection open and reuse it while the path
// stays the same. Switching between the in-memory default (Query) and a session
// path (QuerySession), or between two session paths, closes it and binds the
// new path.
static pthread_mutex_t conn_mutex = PTHREAD_MUTEX_INITIALIZER;
static chdb_connection *conn = NULL;
static char *conn_path = NULL; // NULL: the in-memory default

static int same_path(const char *a, const char *b) {
  if (a == NULL || b == NULL) {
    return a == b;
  }
  return strcmp(a, b) == 0;
}

// Caller holds conn_mutex.
static void close_conn_locked(void) {
  if (conn != NULL) {
    chdb_close_conn(conn);
    conn = NULL;
  }
  free(conn_path);
  conn_path = NULL;
}

// Caller holds conn_mutex. path is NULL for the in-memory default.
static chdb_connection *acquire_conn_locked(const char *path) {
  char dataPath[MAX_PATH_LENGTH];
  char *args[3] = {"clickhouse", NULL, NULL};
  int argc = 1;

  if (conn != NULL && same_path(conn_path, path)) {
    return conn;
  }
  close_conn_locked();

  if (path != NULL) {
    snprintf(dataPath, sizeof(dataPath), "--path=%s", path);
    args[argc++] = dataPath;
  }

  chdb_connection *c = chdb_connect(argc, args);
  if (c == NULL || *c == NULL) {
    fprintf(stderr, "chdb-bun: failed to connect%s%s\n",
            path ? " to path " : "", path ? path : "");
    return NULL;
  }
  conn = c;
  conn_path = path ? strdup(path) : NULL;

  // Backstop for exits that run no JS exit listener (Deno on an uncaught
  // error). Registered after the first chdb_connect() installed libchdb's own
  // exit handler, so it runs before that one, both at exit() and when the
  // runtime unloads this library.
  static int exit_handler_registered = 0;
  if (!exit_handler_registered) {
    exit_handler_registered = 1;
    atexit(Shutdown);
  }
  return conn;
}

// Run a query on the connection for path. Returns a NUL-terminated copy of the
// result (chdb_result_buffer is not NUL-terminated), or NULL on error after
// printing the error to stderr.
static char *run_query(const char *path, const char *query,
                       const char *format) {
  char *output = NULL;

  pthread_mutex_lock(&conn_mutex);
  chdb_connection *c = acquire_conn_locked(path);
  if (c == NULL) {
    pthread_mutex_unlock(&conn_mutex);
    return NULL;
  }

  // The result is read and destroyed under the lock too, so the connection
  // cannot be closed while a result derived from it is alive.
  chdb_result *result =
      chdb_query_n(*c, query, strlen(query), format, strlen(format));
  if (result != NULL) {
    const char *error = chdb_result_error(result);
    if (error != NULL) {
      fprintf(stderr, "%s\n", error);
    } else {
      const char *buf = chdb_result_buffer(result);
      size_t len = chdb_result_length(result);
      output = (char *)malloc(len + 1);
      if (output != NULL) {
        if (len > 0) {
          memcpy(output, buf, len);
        }
        output[len] = '\0';
      }
    }
    chdb_destroy_query_result(result);
  }
  pthread_mutex_unlock(&conn_mutex);
  return output;
}

// Query function without session
char *Query(const char *query, const char *format) {
  return run_query(NULL, query, format);
}

// QuerySession function will save the session to the path
// queries with same path will use the same session
char *QuerySession(const char *query, const char *format, const char *path) {
  return run_query(path, query, format);
}

// Close the connection if it is bound to path, so the directory can be removed
void CloseSession(const char *path) {
  pthread_mutex_lock(&conn_mutex);
  if (conn != NULL && same_path(conn_path, path)) {
    close_conn_locked();
  }
  pthread_mutex_unlock(&conn_mutex);
}

// Close the open connection and stop the engine. index.ts and mod.ts call this
// when the process exits. chdb.h requires a host to close every connection and
// call chdb_shutdown() before its own exit-time teardown: libchdb's atexit
// teardown of an engine still open at exit runs among C++ static destructors
// and can crash while MergeTree background work runs. Like the Python binding,
// stop the engine only if a connection was still open. Queries fail afterwards.
void Shutdown(void) {
  pthread_mutex_lock(&conn_mutex);
  if (conn != NULL) {
    close_conn_locked();
    // Reports its own failure on stderr.
    (void)chdb_shutdown();
  }
  pthread_mutex_unlock(&conn_mutex);
}
