const CACHE =
  'lista-zakupow-v2-rose-20260814-4';


const ASSETS = [
  './',
  './index.html',
  './styles.css?v=20260814-4',
  './app.js?v=20260814-4',
  './manifest.webmanifest?v=20260814-4',
  './icon.svg'
];


self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      caches
        .open(CACHE)

        .then(
          cache =>
            cache.addAll(
              ASSETS
            )
        )

        .then(
          () =>
            self.skipWaiting()
        )

    );

  }
);


self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()

        .then(
          keys =>
            Promise.all(

              keys
                .filter(
                  key =>
                    key !== CACHE
                )

                .map(
                  key =>
                    caches.delete(
                      key
                    )
                )

            )
        )

        .then(
          () =>
            self.clients.claim()
        )

    );

  }
);


self.addEventListener(
  'fetch',
  event => {

    const req =
      event.request;


    if (
      req.method !== 'GET'
    ) {
      return;
    }


    const url =
      new URL(
        req.url
      );


    if (
      url.origin !==
      self.location.origin
    ) {
      return;
    }


    event.respondWith(

      fetch(
        req,
        {
          cache:
            'no-store'
        }
      )

        .then(
          res => {

            if (
              res &&
              res.ok
            ) {

              const copy =
                res.clone();


              caches
                .open(CACHE)

                .then(
                  cache =>
                    cache.put(
                      req,
                      copy
                    )
                )

                .catch(
                  () => {}
                );

            }


            return res;

          }
        )

        .catch(
          () =>
            caches
              .match(req)

              .then(
                cached =>
                  cached ||
                  caches.match(
                    './index.html'
                  )
              )
        )

    );

  }
);
