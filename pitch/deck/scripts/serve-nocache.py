# Static server for the deck with Cache-Control: no-store, so an edited module shows on reload.
# Run from anywhere: python3 -I pitch/deck/scripts/serve-nocache.py <port> <path to pitch/deck>
import sys, http.server, functools
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass
port, root = int(sys.argv[1]), sys.argv[2]
# The deck asks for about 30 files at once. With the default backlog of 5, Windows refuses the rest when two browsers
# load it together, a module fails and the page stays black.
http.server.ThreadingHTTPServer.request_queue_size = 128
http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory=root)).serve_forever()
