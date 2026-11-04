#pragma once

char *Query(const char *query, const char *format);
char *QuerySession(const char *query, const char *format, const char *path);
void CloseSession(const char *path);
void Shutdown(void);
