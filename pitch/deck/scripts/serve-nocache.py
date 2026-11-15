# Static server for the deck with Cache-Control: no-store, so an edited module shows on reload.
# Run from anywhere: python3 -I pitch/deck/scripts/serve-nocache.py <port> <path to pitch/deck>
import sys, http.server, functools
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass
port, root = int(sys.argv[1]), sys.argv[2]
http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory=root)).serve_forever()
