#!/usr/bin/env python3
"""
server.py — serve sensor-dashboard tại http://localhost:8080
Đặt file này cùng thư mục với index.html và sensors.json
"""

import http.server
import socketserver
import os

PORT = 8080
DIR  = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

   
    def log_message(self, format, *args):
        print(f"  {self.address_string()} → {args[0]}")

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"http://localhost:{PORT}")
        httpd.serve_forever()
