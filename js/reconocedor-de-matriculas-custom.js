/* inicio page loader rápido por prioridad: CSS delayer */

/*! loadCSS rel=preload polyfill. [c]2017 Filament Group, Inc. MIT License */
(function (w) {
  "use strict";
  if (!w.loadCSS) {
    w.loadCSS = function () {};
  }
  var rp = (loadCSS.relpreload = {});
  rp.support = (function () {
    var ret;
    try {
      ret = w.document.createElement("link").relList.supports("preload");
    } catch (e) {
      ret = !1;
    }
    return function () {
      return ret;
    };
  })();
  rp.bindMediaToggle = function (link) {
    var finalMedia = link.media || "all";
    function enableStylesheet() {
      link.media = finalMedia;
    }
    if (link.addEventListener) {
      link.addEventListener("load", enableStylesheet);
    } else if (link.attachEvent) {
      link.attachEvent("onload", enableStylesheet);
    }
    setTimeout(function () {
      link.rel = "stylesheet";
      link.media = "only x";
    });
    setTimeout(enableStylesheet, 3000);
  };
  rp.poly = function () {
    if (rp.support()) {
      return;
    }
    var links = w.document.getElementsByTagName("link");
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (
        link.rel === "preload" &&
        link.getAttribute("as") === "style" &&
        !link.getAttribute("data-loadcss")
      ) {
        link.setAttribute("data-loadcss", !0);
        rp.bindMediaToggle(link);
      }
    }
  };
  if (!rp.support()) {
    rp.poly();
    var run = w.setInterval(rp.poly, 500);
    if (w.addEventListener) {
      w.addEventListener("load", function () {
        rp.poly();
        w.clearInterval(run);
      });
    } else if (w.attachEvent) {
      w.attachEvent("onload", function () {
        rp.poly();
        w.clearInterval(run);
      });
    }
  }
  if (typeof exports !== "undefined") {
    exports.loadCSS = loadCSS;
  } else {
    w.loadCSS = loadCSS;
  }
})(typeof global !== "undefined" ? global : this);

/* fin page loader rápido por prioridad: CSS delayer */

/* inicio js webs de platerecog */


      class RocketBrowserCompatibilityChecker {
        constructor(options) {
          this.passiveSupported = false;

          this._checkPassiveOption(this);
          this.options = this.passiveSupported ? options : false;
        }

        /**
         * Initializes browser check for addEventListener passive option.
         *
         * @link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
         * @private
         *
         * @param self Instance of this object.
         * @returns {boolean}
         */
        _checkPassiveOption(self) {
          try {
            const options = {
              // This function will be called when the browser attempts to access the passive property.
              get passive() {
                self.passiveSupported = true;
                return false;
              },
            };

            window.addEventListener("test", null, options);
            window.removeEventListener("test", null, options);
          } catch (err) {
            self.passiveSupported = false;
          }
        }

        /**
         * Checks if the browser supports requestIdleCallback and cancelIdleCallback. If no, shims its behavior with a polyfills.
         *
         * @link @link https://developers.google.com/web/updates/2015/08/using-requestidlecallback
         */
        initRequestIdleCallback() {
          if (!"requestIdleCallback" in window) {
            window.requestIdleCallback = (cb) => {
              const start = Date.now();
              return setTimeout(() => {
                cb({
                  didTimeout: false,
                  timeRemaining: function timeRemaining() {
                    return Math.max(0, 50 - (Date.now() - start));
                  },
                });
              }, 1);
            };
          }

          if (!"cancelIdleCallback" in window) {
            window.cancelIdleCallback = (id) => clearTimeout(id);
          }
        }

        /**
         * Detects if data saver mode is on.
         *
         * @link https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/save-data/#detecting_the_save-data_setting
         *
         * @returns {boolean|boolean}
         */
        isDataSaverModeOn() {
          return (
            "connection" in navigator && true === navigator.connection.saveData
          );
        }

        /**
         * Checks if the browser supports link prefetch.
         *
         * @returns {boolean|boolean}
         */
        supportsLinkPrefetch() {
          const elem = document.createElement("link");
          return (
            elem.relList &&
            elem.relList.supports &&
            elem.relList.supports("prefetch") &&
            window.IntersectionObserver &&
            "isIntersecting" in IntersectionObserverEntry.prototype
          );
        }

        isSlowConnection() {
          return (
            "connection" in navigator &&
            "effectiveType" in navigator.connection &&
            ("2g" === navigator.connection.effectiveType ||
              "slow-2g" === navigator.connection.effectiveType)
          );
        }
      }

      class RocketLazyLoadScripts {
        constructor(triggerEvents, browser) {
          this.attrName = "data-rocketlazyloadscript";
          this.browser = browser;
          this.options = this.browser.options;
          this.triggerEvents = triggerEvents;
          this.userEventListener = this.triggerListener.bind(this);
        }

        /**
         * Initializes the LazyLoad Scripts handler.
         */
        init() {
          this._addEventListener(this);
        }

        /**
         * Resets the handler.
         */
        reset() {
          this._removeEventListener(this);
        }

        /**
         * Adds a listener for each of the configured user interactivity event type. When an even is triggered, it invokes
         * the triggerListener() method.
         *
         * @private
         *
         * @param self Instance of this object.
         */
        _addEventListener(self) {
          this.triggerEvents.forEach((eventName) =>
            window.addEventListener(
              eventName,
              self.userEventListener,
              self.options
            )
          );
        }

        /**
         * Removes the listener for each of the configured user interactivity event type.
         *
         * @private
         *
         * @param self Instance of this object.
         */
        _removeEventListener(self) {
          this.triggerEvents.forEach((eventName) =>
            window.removeEventListener(
              eventName,
              self.userEventListener,
              self.options
            )
          );
        }

        /**
         * Loads the script's src from the data attribute, which will then trigger the browser to request and
         * load the script.
         */
        _loadScriptSrc() {
          const scripts = document.querySelectorAll(`script[${this.attrName}]`);

          if (0 === scripts.length) {
            this.reset();
            return;
          }

          Array.prototype.slice.call(scripts).forEach((elem) => {
            const scriptSrc = elem.getAttribute(this.attrName);

            elem.setAttribute("src", scriptSrc);
            elem.removeAttribute(this.attrName);
          });

          this.reset();
        }

        /**
         * Window event listener - when triggered, invokes the load script src handler and then resets.
         */
        triggerListener() {
          this._loadScriptSrc();
          this._removeEventListener(this);
        }

        /**
         * Named static constructor to encapsulate how to create the object.
         */
        static run() {
          // Bail out if the browser checker does not exist.
          if (!RocketBrowserCompatibilityChecker) {
            return;
          }

          const options = {
            passive: true,
          };
          const browser = new RocketBrowserCompatibilityChecker(options);
          const instance = new RocketLazyLoadScripts(
            ["keydown", "mouseover", "touchmove", "touchstart"],
            browser
          );
          instance.init();
        }
      }

      RocketLazyLoadScripts.run();
    
      window.lazyLoadOptions = {
        elements_selector:
          "img[data-lazy-src],.rocket-lazyload,iframe[data-lazy-src]",
        data_src: "lazy-src",
        data_srcset: "lazy-srcset",
        data_sizes: "lazy-sizes",
        class_loading: "lazyloading",
        class_loaded: "lazyloaded",
        threshold: 300,
        callback_loaded: function (element) {
          if (
            element.tagName === "IFRAME" &&
            element.dataset.rocketLazyload == "fitvidscompatible"
          ) {
            if (element.classList.contains("lazyloaded")) {
              if (typeof window.jQuery != "undefined") {
                if (jQuery.fn.fitVids) {
                  jQuery(element).parent().fitVids();
                }
              }
            }
          }
        },
      };
      window.addEventListener(
        "LazyLoad::Initialized",
        function (e) {
          var lazyLoadInstance = e.detail.instance;

          if (window.MutationObserver) {
            var observer = new MutationObserver(function (mutations) {
              var image_count = 0;
              var iframe_count = 0;
              var rocketlazy_count = 0;

              mutations.forEach(function (mutation) {
                for (i = 0; i < mutation.addedNodes.length; i++) {
                  if (
                    typeof mutation.addedNodes[i].getElementsByTagName !==
                    "function"
                  ) {
                    continue;
                  }

                  if (
                    typeof mutation.addedNodes[i].getElementsByClassName !==
                    "function"
                  ) {
                    continue;
                  }

                  images = mutation.addedNodes[i].getElementsByTagName("img");
                  is_image = mutation.addedNodes[i].tagName == "IMG";
                  iframes = mutation.addedNodes[i].getElementsByTagName(
                    "iframe"
                  );
                  is_iframe = mutation.addedNodes[i].tagName == "IFRAME";
                  rocket_lazy = mutation.addedNodes[i].getElementsByClassName(
                    "rocket-lazyload"
                  );

                  image_count += images.length;
                  iframe_count += iframes.length;
                  rocketlazy_count += rocket_lazy.length;

                  if (is_image) {
                    image_count += 1;
                  }

                  if (is_iframe) {
                    iframe_count += 1;
                  }
                }
              });

              if (image_count > 0 || iframe_count > 0 || rocketlazy_count > 0) {
                lazyLoadInstance.update();
              }
            });

            var b = document.getElementsByTagName("body")[0];
            var config = { childList: true, subtree: true };

            observer.observe(b, config);
          }
        },
        false
      );