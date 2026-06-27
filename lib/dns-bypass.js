// This helper overrides Node's dns.lookup for api.themoviedb.org to use Cloudflare/Google DNS
// directly. This bypasses ISP-level DNS blocking (e.g., from Jio in India) on the server.
if (typeof window === "undefined") {
  try {
    const dns = eval("require")("dns");
    const { Resolver } = dns;
    const resolver = new Resolver();
    resolver.setServers(["1.1.1.1", "8.8.8.8"]);

    const originalLookup = dns.lookup;
    dns.lookup = function (hostname, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }

      if (hostname === "api.themoviedb.org") {
        resolver.resolve4(hostname, (err, addresses) => {
          if (err || !addresses || addresses.length === 0) {
            return originalLookup(hostname, options, callback);
          }
          const isAll = options && options.all;
          if (isAll) {
            const results = addresses.map((ip) => ({ address: ip, family: 4 }));
            callback(null, results);
          } else {
            const ip = addresses[0];
            callback(null, ip, 4);
          }
        });
      } else {
        originalLookup(hostname, options, callback);
      }
    };
    console.log("TMDB DNS bypass initialized successfully.");
  } catch (e) {
    console.warn("Failed to initialize TMDB DNS bypass:", e.message);
  }
}
