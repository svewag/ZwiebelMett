(function(win, doc) {

  win.ZwiebelMett = {
    _waitReady: true,
    Bind: function(fn, context, args) {
      return function() {
        fn.apply(context, args);
      };
    },

    log: (function() {
      if (typeof(console) != "undefined" && console.log) {
        return function() { console.log.apply(console, arguments); };
      }
      return function() {};
    })(),

    DOMBind: function(str, type, fn, live) {
      var $elements = $(str);
      if (live) {
        $elements.live(type, function(event) {
          fn.call(this, event);
        });
      } else {
        $elements.bind(type, function(event) {
          fn.call(this, event);
        });
      }
    },

    Doclet: function(name, doclet) {
      if (!this._doclets) {
        this._doclets = {};
      }
      if (!doclet) {
        return this._doclets[name];
      }
      if (this._doclets[name]) {
        throw new Error("You could only register a doclet once(" + name + ")");
      }
      
      var my = {
        initOnWindowLoad: doclet.initOnWindowLoad,
        name: name,
        initialized: false,
        doclet: doclet,
        bind: function(node, isPartial) {
          this.doclet.message = this.message;
          this.doclet.bind && this.doclet.bind(node, isPartial);
          this.initialized = true;
        },
        message: function(message){
          var fullMessageName = "Doclet:" + name + ":" + message;
          
          return {
            pub: function(data){
              ZwiebelMett.Message.pub(fullMessageName, data);
            },
            sub: function(func){
              ZwiebelMett.Message.sub(fullMessageName, func);
            },
            unsub: function (func) {
              ZwiebelMett.Message.unsub(fullMessageName, func);
            }
          };
        }
      };
      this._doclets[name] = my;
      
      doclet.preReady && doclet.preReady(doclet);
      !this._waitReady && my.bind(doc, false);
      
      return my;
    },

    Message: (function() {
      var $window = $(window);
      return {
        pub: function(event, data) {
          ZwiebelMett.log("pub-event: " + event, " with pub-data: ", data);
          $window.trigger(event, data);
        },

        sub: function(event, func) {
          ZwiebelMett.log("sub-event: " + event);
          $window.bind(event, func);
        },

        unsub: function(event, func) {
          ZwiebelMett.log("unsub-event: " + event);
          $window.unbind(event, func);
        }
      };
    })(),

    Ajax: (function() {
      var ret = function(url, opts) {
        $.ajax(url, opts);
      };
      ret.partial = function(url, opts, success) {
        opts.async = true;
        success = opts.success;
        opts.success = function(html, textStatus, jqXHR) {
          var $partial = $("<div></div>").addClass("ZwiebelMettAjax").append(html);
          opts.filter && opts.filter($partial, textStatus, jqXHR);
          for (var i in ZwiebelMett._doclets) {
            var doclet = ZwiebelMett._doclets[i];
            doclet.bind && doclet.bind($partial[0], true);
          }
          success.apply(this, [$partial[0], textStatus, jqXHR]);
        };
        return $.ajax(url, opts);
      };
      return ret;
    })(),

    Container: function() {
      return function(name, container) {
        if (!this._containers) {
          this._containers = {};
        }
        if (!container) {
          return this._containers[name];
        }
        if (this._containers[name]) {
          throw new Error("You could only register a container once (" + name + ")");
        }

        var my = {
          name: name,
          container: container,
          bind: function(node) {
            this.container.message = function(message){
              var fullMessageName = "Container:" + name + ":" + message;
              return {
                pub: function(data){
                  ZwiebelMett.Message.pub(fullMessageName, data);
                },
                sub: function(func){
                  ZwiebelMett.Message.sub(fullMessageName, func);
                },
                unsub: function (func) {
                  ZwiebelMett.Message.unsub(fullMessageName, func);
                }
              };
            };
            this.container.bind(node);
          },
          get: function(node) {
            return $(node).data("Container")[this.name];
          },
          create: function(node, doclet) {
            var $node = $(node);
            var dataContainer = $node.data("Container");
            if (!dataContainer) {
              dataContainer = {};
              $(node).data("Container", dataContainer);
            }
            var my = function() {};
            my.prototype = this.container;
            my = new my();
            my.container = my;
            my.name = name;
            my.message = function(message){
              var fullMessageName = "Container:" + this.name + ":" + message;
              return {
                pub: function(data){
                  ZwiebelMett.Message.pub(fullMessageName, data);
                },
                sub: function(func){
                  ZwiebelMett.Message.sub(fullMessageName, func);
                },
                unsub: function (func) {
                  ZwiebelMett.Message.unsub(fullMessageName, func);
                }
              };
            };
            my.doclet = doclet;
            my.buildGetterAndSetter = function() {
              var length = my.fields ? my.fields.length : 0;
              for (var i = length - 1; i >= 0; i--) {
                (function () {
                  var field = my.fields[i];
                  my[field] = function(val) {
                    var f = "_" + field;
                    if (val !== undefined) {
                      my[f] = val;
                      my.$container.data(field.toLowerCase(), val);
                      my.$container.attr("data-" + field.toLowerCase(), val);
                    }

                    if (my[f] === undefined) {
                      my[f] = "" + my.$container.attr("data-" + field.toLowerCase());
                      if (my[f] === "true" || my[f] === "True") {
                        my[f] = true;
                      } else if (my[f] === "false" || my[f] === "False") {
                        my[f] = false;
                      } else if (my[f] === "undefined") {
                        my[f] = undefined;
                      }
                    }
                    return my[f];
                  };
                })();
              };
            };
            my.bind(node);
            dataContainer[this.name] = my;
            return my;
          }
        };
        this._containers[name] = my;
        return my;
      };
    }(),

    Test: function() {
      var testFrame = ZwiebelMett.TestFrame;
      testFrame.pushContext("doclets");
      for ( var i in this._doclets) {
        var doclet = this._doclets[i];
        testFrame.pushContext(i);
        doclet && doclet.doclet.test && doclet.doclet.test(testFrame);
        testFrame.popContext();
      }
      testFrame.popContext();
      testFrame.pushContext("containers");
      for ( var j in this._containers) {
        var container = this._containers[j];
        testFrame.pushContext(j);
        container && container.container && container.container.test
            && container.container.test(testFrame);
        testFrame.popContext();
      }
      testFrame.popContext();
    }
  };

  $(function() {
    if (!ZwiebelMett._waitReady) {
      return;

    }
    ZwiebelMett._waitReady = false;
    var doclets = $("body").data("doclets") || "";
    var docletList = doclets.split(' ');

    var bind = false;
    for (var docletName in ZwiebelMett._doclets) {
      var doclet = ZwiebelMett.Doclet(docletName);
      if (doclet.initOnWindowLoad){
        bind = true;
      } else {
        for (var i = docletList.length - 1; i >= 0; i--) {
          if(docletList[i] === doclet.name){
            bind = true;
          }
        };
      }

      if(bind){
        doclet && doclet.bind(doc, false);
      }
    };

    for (var i = 0; i < docletList.length; i++) {
      ZwiebelMett.Doclet(docletList[i]).doclet.ready && ZwiebelMett.Doclet(docletList[i]).doclet.ready();
    };

  });
})(window, document);