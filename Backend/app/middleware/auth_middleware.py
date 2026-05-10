from fastapi import Request
import time

async def log_request_time(request: Request, call_next):
    """
    Optional middleware to log request execution time.
    Authentication is currently handled in app/utils/dependencies.py.
    """
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
