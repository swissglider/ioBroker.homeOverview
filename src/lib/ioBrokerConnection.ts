export class IOBrokerConnection {
  private _socket;
  // private _onConnChange;
  // private _onUpdate;
  private _isConnected = false;
  private _disconnectedSince;
  private _connCallbacks: {
    onObjectChange; // (id, obj) => {}
    onConnChange; // (isConnected) => {}
    onStateChange; // (id, state) => {}
    onRefresh; // not yet implemented
    onAuth; // not yet implemented
    onCommand; // (instance, command, data) => {},
    onError; // (err) => {}
  };
  private _authInfo;
  private _isAuthDone = false;
  private _isAuthRequired = false;
  private _authRunning = false;
  private _cmdQueue: object[] = [];
  private _connTimer;
  private _type = "socket.io"; // [SignalR | socket.io | local]
  private _timeout: number = 0; // 0 - use transport default timeout to detect disconnect
  private _cmdData;
  private _cmdInstance;
  private _isSecure: boolean = false;
  private _defaultMode = 0x644;
  private _objects; // used if _useStorage === true
  private _enums; // used if _useStorage === true
  private _user;
  private _timer;
  private _lastTimer: number = 0;
  private _reconnectInterval: number = 10000; // reconnect interval
  private _reloadInterval: number = 30; // if connection was absent longer than 30 seconds
  private _connectInterval;
  private _countDown;
  private _countInterval;
  private gettingStates;

  public namespace: string;

  constructor(namespace: string | "vis.0", socket) {
    this.namespace = namespace;
    this._socket = socket;
  }

  public getType() {
    return this._type;
  }

  public getIsConnected() {
    return this._isConnected;
  }

  public getIsLoginRequired() {
    return this._isSecure;
  }

  public getUser() {
    return this._user;
  }

  private _checkConnection(func: string, _arguments) {
    if (!this._isConnected) {
      console.log("No connection!");
      return false;
    }

    // if (this._queueCmdIfRequired(func, _arguments)) return false;

    //socket.io
    if (this._socket === null) {
      console.log("socket.io not initialized");
      return false;
    }

    return true;
  }

  private _monitor() {
    if (this._timer) return;
    var ts = new Date().getTime();
    if (
      this._reloadInterval &&
      ts - this._lastTimer > this._reloadInterval * 1000
    ) {
      // It seems, that PC was in a sleep => Reload page to request authentication anew
      window.location.reload();
    } else {
      this._lastTimer = ts;
    }
    var that = this;
    this._timer = setTimeout(function() {
      that._timer = null;
      that._monitor();
    }, 10000);
  }

  private _onAuth(objectsRequired, isSecure) {
    var that = this;
    this._isSecure = isSecure;
    if (this._isSecure) {
      that._lastTimer = new Date().getTime();
      this._monitor();
    }
    this._socket.emit("subscribe", "*");
    if (objectsRequired) this._socket.emit("subscribeObjects", "*");
    if (this._isConnected === true) {
      // This seems to be a reconnect because we're already connected!
      // -> prevent firing onConnChange twice
      return;
    }
    this._isConnected = true;
    if (this._connCallbacks.onConnChange) {
      setTimeout(function() {
        that._socket.emit("authEnabled", function(auth, user) {
          that._user = user;
          that._connCallbacks.onConnChange(that._isConnected);
        });
      }, 0);
    }
  }

  public init(connCallbacks, objectsRequired) {
    const that = this; // support of old safary
    this._connCallbacks = connCallbacks;

    this._socket.on("connect", function() {
      if (that._disconnectedSince) {
        var offlineTime = new Date().getTime() - that._disconnectedSince;
        console.log("was offline for " + offlineTime / 1000 + "s");

        // reload whole page if no connection longer than some period
        if (that._reloadInterval && offlineTime > that._reloadInterval * 1000)
          window.location.reload();

        that._disconnectedSince = null;
      }

      if (that._connectInterval) {
        clearInterval(that._connectInterval);
        that._connectInterval = null;
      }
      if (that._countInterval) {
        clearInterval(that._countInterval);
        that._countInterval = null;
      }
      var elem = document.getElementById("server-disconnect");
      if (elem) elem.style.display = "none";

      that._socket.emit("name", that.namespace);
      console.log(new Date().toISOString() + " Connected => authenticate");
      setTimeout(function() {
        var wait = setTimeout(function() {
          console.error("No answer from server");
          window.location.reload();
        }, 3000);

        that._socket.emit("authenticate", function(isOk, isSecure) {
          clearTimeout(wait);
          console.log(new Date().toISOString() + " Authenticated: " + isOk);
          if (isOk) {
            that._onAuth(objectsRequired, isSecure);
          } else {
            console.log("permissionError");
          }
        });
      }, 50);
    });

    this._socket.on("reauthenticate", function() {
      if (that._connCallbacks.onConnChange) {
        that._connCallbacks.onConnChange(false);
        // if (typeof app !== 'undefined') app.onConnChange(false);
      }
      console.warn("reauthenticate");
      window.location.reload();
    });

    this._socket.on("connect_error", function() {
      console.error("ioBroker Connection: connection_error");
    });

    this._socket.on("disconnect", function() {
      that._disconnectedSince = new Date().getTime();

      // called only once when connection lost (and it was here before)
      that._isConnected = false;
      if (that._connCallbacks.onConnChange) {
        setTimeout(function() {
          var elem = document.getElementById("server-disconnect");
          if (elem) elem.style.display = "";
          that._connCallbacks.onConnChange(that._isConnected);
          // if (typeof app !== 'undefined') app.onConnChange(that._isConnected);
        }, 5000);
      } else {
        var elem = document.getElementById("server-disconnect");
        if (elem) elem.style.display = "";
      }
    });

    // after reconnect the 'connect' event will be called
    this._socket.on("reconnect", function() {
      var offlineTime = new Date().getTime() - that._disconnectedSince;
      console.log("was offline for " + offlineTime / 1000 + "s");

      // reload whole page if no connection longer than one minute
      if (that._reloadInterval && offlineTime > that._reloadInterval * 1000) {
        window.location.reload();
      }
      // anyway 'on connect' is called
    });

    this._socket.on("objectChange", function(id, obj) {
      if (that._connCallbacks.onObjectChange)
        that._connCallbacks.onObjectChange(id, obj);
    });

    this._socket.on("stateChange", function(id, state) {
      if (!id || state === null || typeof state !== "object") return;

      if (
        that._connCallbacks.onCommand &&
        id === that.namespace + ".control.command"
      ) {
        if (state.ack) return;

        if (
          state.val &&
          typeof state.val === "string" &&
          state.val[0] === "{" &&
          state.val[state.val.length - 1] === "}"
        ) {
          try {
            state.val = JSON.parse(state.val);
          } catch (e) {
            console.log(
              "Command seems to be an object, but cannot parse it: " + state.val
            );
          }
        }

        // if command is an object {instance: 'iii', command: 'cmd', data: 'ddd'}
        if (state.val && state.val.instance) {
          if (
            that._connCallbacks.onCommand(
              state.val.instance,
              state.val.command,
              state.val.data
            )
          ) {
            // clear state
            that.setState(
              id,
              {
                val: "",
                ack: true
              },
              () => {}
            );
          }
        } else {
          if (
            that._connCallbacks.onCommand(
              that._cmdInstance,
              state.val,
              that._cmdData
            )
          ) {
            // clear state
            that.setState(
              id,
              {
                val: "",
                ack: true
              },
              () => {}
            );
          }
        }
      } else if (id === that.namespace + ".control.data") {
        that._cmdData = state.val;
      } else if (id === that.namespace + ".control.instance") {
        that._cmdInstance = state.val;
      } else if (that._connCallbacks.onStateChange) {
        that._connCallbacks.onStateChange(id, state);
      }
    });

    this._socket.on("permissionError", function(err) {
      if (that._connCallbacks.onError) {
        /* {
                 command:
                 type:
                 operation:
                 arg:
                 }*/
        that._connCallbacks.onError(err);
      } else {
        console.log("permissionError");
      }
    });
  }

  public logout(callback) {
    if (!this._isConnected) {
      console.log("No connection!");
      return;
    }

    this._socket.emit("logout", callback);
  }

  public getVersion(callback) {
    if (!this._checkConnection("getVersion", arguments)) return;

    this._socket.emit("getVersion", function(version) {
      if (callback) callback(version);
    });
  }

  private _checkAuth(callback) {
    if (!this._isConnected) {
      console.log("No connection!");
      return;
    }
    //socket.io
    if (this._socket === null) {
      console.log("socket.io not initialized");
      return;
    }
    this._socket.emit("getVersion", function(version) {
      if (callback) callback(version);
    });
  }

  public readFile(filename, callback, isRemote) {
    if (!callback) throw "No callback set";

    if (!this._checkConnection("readFile", arguments)) return;

    var adapter = this.namespace;
    if (filename[0] === "/") {
      var p = filename.split("/");
      adapter = p[1];
      p.splice(0, 2);
      filename = p.join("/");
    }

    this._socket.emit("readFile", adapter, filename, function(
      err,
      data,
      mimeType
    ) {
      setTimeout(function() {
        callback(err, data, filename, mimeType);
      }, 0);
    });
  }

  public getMimeType(ext) {
    if (ext.indexOf(".") !== -1) ext = ext.toLowerCase().match(/\.[^.]+$/);
    var _mimeType;
    if (ext === ".css") {
      _mimeType = "text/css";
    } else if (ext === ".bmp") {
      _mimeType = "image/bmp";
    } else if (ext === ".png") {
      _mimeType = "image/png";
    } else if (ext === ".jpg") {
      _mimeType = "image/jpeg";
    } else if (ext === ".jpeg") {
      _mimeType = "image/jpeg";
    } else if (ext === ".gif") {
      _mimeType = "image/gif";
    } else if (ext === ".tif") {
      _mimeType = "image/tiff";
    } else if (ext === ".js") {
      _mimeType = "application/javascript";
    } else if (ext === ".html") {
      _mimeType = "text/html";
    } else if (ext === ".htm") {
      _mimeType = "text/html";
    } else if (ext === ".json") {
      _mimeType = "application/json";
    } else if (ext === ".xml") {
      _mimeType = "text/xml";
    } else if (ext === ".svg") {
      _mimeType = "image/svg+xml";
    } else if (ext === ".eot") {
      _mimeType = "application/vnd.ms-fontobject";
    } else if (ext === ".ttf") {
      _mimeType = "application/font-sfnt";
    } else if (ext === ".woff") {
      _mimeType = "application/font-woff";
    } else if (ext === ".wav") {
      _mimeType = "audio/wav";
    } else if (ext === ".mp3") {
      _mimeType = "audio/mpeg3";
    } else {
      _mimeType = "text/javascript";
    }
    return _mimeType;
  }

  public readFile64(filename, callback, isRemote) {
    var that = this;
    if (!callback) {
      throw "No callback set";
    }

    if (!this._checkConnection("readFile", arguments)) return;

    var adapter = this.namespace;
    if (filename[0] === "/") {
      var p = filename.split("/");
      adapter = p[1];
      p.splice(0, 2);
      filename = p.join("/");
    }

    this._socket.emit("readFile64", adapter, filename, function(
      err,
      data,
      mimeType
    ) {
      setTimeout(function() {
        if (data) {
          callback(
            err,
            {
              mime: mimeType || that.getMimeType(filename),
              data: data
            },
            filename
          );
        } else {
          callback(
            err,
            {
              mime: mimeType || that.getMimeType(filename)
            },
            filename
          );
        }
      }, 0);
    });
  }

  public writeFile(filename, data, mode, callback) {
    if (typeof mode === "function") {
      callback = mode;
      mode = null;
    }

    if (!this._checkConnection("writeFile", arguments)) return;

    if (typeof data === "object") data = JSON.stringify(data, null, 2);

    var parts = filename.split("/");
    var adapter = parts[1];
    parts.splice(0, 2);
    if (adapter === "vis") {
      this._socket.emit(
        "writeFile",
        adapter,
        parts.join("/"),
        data,
        mode
          ? {
              mode: this._defaultMode
            }
          : {},
        callback
      );
    } else {
      this._socket.emit(
        "writeFile",
        this.namespace,
        filename,
        data,
        mode
          ? {
              mode: this._defaultMode
            }
          : {},
        callback
      );
    }
  }

  // Write file base 64
  public writeFile64(filename, data, callback) {
    if (!this._checkConnection("writeFile", arguments)) return;

    var parts = filename.split("/");
    var adapter = parts[1];
    parts.splice(0, 2);

    this._socket.emit(
      "writeFile",
      adapter,
      parts.join("/"),
      atob(data),
      {
        mode: this._defaultMode
      },
      callback
    );
  }

  public readDir(dirname, callback) {
    //socket.io
    if (this._socket === null) {
      console.log("socket.io not initialized");
      return;
    }
    if (!dirname) dirname = "/";
    var parts = dirname.split("/");
    var adapter = parts[1];
    parts.splice(0, 2);

    this._socket.emit(
      "readDir",
      adapter,
      parts.join("/"),
      {
        filter: true
      },
      function(err, data) {
        if (callback) callback(err, data);
      }
    );
  }

  public mkdir(dirname, callback) {
    var parts = dirname.split("/");
    var adapter = parts[1];
    parts.splice(0, 2);

    this._socket.emit("mkdir", adapter, parts.join("/"), function(err) {
      if (callback) callback(err);
    });
  }

  public unlink(name, callback) {
    var parts = name.split("/");
    var adapter = parts[1];
    parts.splice(0, 2);

    this._socket.emit("unlink", adapter, parts.join("/"), function(err) {
      if (callback) callback(err);
    });
  }

  public renameFile(oldname, newname, callback) {
    var parts1 = oldname.split("/");
    var adapter = parts1[1];
    parts1.splice(0, 2);
    var parts2 = newname.split("/");
    parts2.splice(0, 2);
    this._socket.emit(
      "rename",
      adapter,
      parts1.join("/"),
      parts2.join("/"),
      function(err) {
        if (callback) callback(err);
      }
    );
  }

  public setState(pointId, value, callback) {
    //socket.io
    if (this._socket === null) {
      //console.log('socket.io not initialized');
      return;
    }
    this._socket.emit("setState", pointId, value, callback);
  }

  public sendTo(instance, command, payload, callback) {
    //socket.io
    if (this._socket === null) {
      //console.log('socket.io not initialized');
      return;
    }
    this._socket.emit("sendTo", instance, command, payload, callback);
  }

  public getStates(IDs, callback) {
    if (typeof IDs === "function") {
      callback = IDs;
      IDs = null;
    }

    if (this._type === "local") {
      return callback(null, []);
    } else {
      if (!this._checkConnection("getStates", arguments)) return;

      this.gettingStates = this.gettingStates || 0;
      this.gettingStates++;
      // if (this.gettingStates > 1) {
      //   // fix for slow devices
      //   console.log(
      //     "Trying to get empty list, because the whole list could not be loaded"
      //   );
      //   IDs = [];
      // }
      var that = this;
      this._socket.emit("getStates", IDs, function(err, data) {
        that.gettingStates--;
        if (err || !data) {
          if (callback) {
            callback(err || "Authentication required");
          }
        } else if (callback) {
          callback(null, data);
        }
      });
    }
  }

  private _fillChildren(objects) {
    var items = [];

    for (var id in objects) {
      items.push(id);
    }
    items.sort();

    for (var i = 0; i < items.length; i++) {
      if (objects[items[i]].common) {
        var j = i + 1;
        var children = [];
        var len = items[i].length + 1;
        var name = items[i] + ".";
        while (j < items.length && items[j].substring(0, len) === name) {
          children.push(items[j++]);
        }

        objects[items[i]].children = children;
      }
    }
  }

  public getObjects(callback) {
    if (!this._checkConnection("getObjects", arguments)) return;
    var that = this;
    this._socket.emit("getObjects", function(err, data) {
      // Read all enums
      that._socket.emit(
        "getObjectView",
        "system",
        "enum",
        {
          startkey: "enum.",
          endkey: "enum.\u9999"
        },
        function(err, res) {
          if (err) {
            callback(err);
            return;
          }
          var result = {};
          var enums = {};
          for (var i = 0; i < res.rows.length; i++) {
            data[res.rows[i].id] = res.rows[i].value;
            enums[res.rows[i].id] = res.rows[i].value;
          }
          // Read all adapters for images
          that._socket.emit(
            "getObjectView",
            "system",
            "instance",
            {
              startkey: "system.adapter.",
              endkey: "system.adapter.\u9999"
            },
            function(err, res) {
              if (err) {
                callback(err);
                return;
              }
              var result = {};
              for (var i = 0; i < res.rows.length; i++) {
                data[res.rows[i].id] = res.rows[i].value;
              }
              // find out default file mode
              if (
                data["system.adapter." + that.namespace] &&
                data["system.adapter." + that.namespace].native &&
                data["system.adapter." + that.namespace].native.defaultFileMode
              ) {
                that._defaultMode =
                  data[
                    "system.adapter." + that.namespace
                  ].native.defaultFileMode;
              }

              // Read all channels for images
              that._socket.emit(
                "getObjectView",
                "system",
                "channel",
                {
                  startkey: "",
                  endkey: "\u9999"
                },
                function(err, res) {
                  if (err) {
                    callback(err);
                    return;
                  }
                  var result = {};
                  for (var i = 0; i < res.rows.length; i++) {
                    data[res.rows[i].id] = res.rows[i].value;
                  }

                  // Read all devices for images
                  that._socket.emit(
                    "getObjectView",
                    "system",
                    "device",
                    {
                      startkey: "",
                      endkey: "\u9999"
                    },
                    function(err, res) {
                      if (err) {
                        callback(err);
                        return;
                      }
                      var result = {};
                      for (var i = 0; i < res.rows.length; i++) {
                        data[res.rows[i].id] = res.rows[i].value;
                      }

                      if (callback) callback(err, data);
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }

  public getChildren(id, callback) {
    if (!this._checkConnection("getChildren", arguments)) return;

    if (typeof id === "function") {
      callback = id;
      id = null;
    }

    if (!id) return callback("getChildren: no id given");

    var that = this;
    var data = [];

    // Read all devices
    that._socket.emit(
      "getObjectView",
      "system",
      "device",
      {
        startkey: id + ".",
        endkey: id + ".\u9999"
      },
      function(err, res) {
        if (err) {
          callback(err);
          return;
        }
        var result = {};
        for (var i = 0; i < res.rows.length; i++) {
          data[res.rows[i].id] = res.rows[i].value;
        }

        that._socket.emit(
          "getObjectView",
          "system",
          "channel",
          {
            startkey: id + ".",
            endkey: id + ".\u9999"
          },
          function(err, res) {
            if (err) {
              callback(err);
              return;
            }
            var result = {};
            for (var i = 0; i < res.rows.length; i++) {
              data[res.rows[i].id] = res.rows[i].value;
            }

            // Read all adapters for images
            that._socket.emit(
              "getObjectView",
              "system",
              "state",
              {
                startkey: id + ".",
                endkey: id + ".\u9999"
              },
              function(err, res) {
                if (err) {
                  callback(err);
                  return;
                }
                var result = {};
                for (var i = 0; i < res.rows.length; i++) {
                  data[res.rows[i].id] = res.rows[i].value;
                }
                var list = [];

                var count = id.split(".").length;

                // find direct children
                for (var _id in data) {
                  var parts = _id.split(".");
                  if (count + 1 === parts.length) {
                    list.push(_id);
                  }
                }
                list.sort();

                if (callback) callback(err, list);
              }.bind(this)
            );
          }.bind(this)
        );
      }.bind(this)
    );
  }

  public getObject(id, callback) {
    if (!id) return callback("no id given");

    this._socket.emit(
      "getObject",
      id,
      function(err, obj) {
        if (err) {
          callback(err);
          return;
        }
        return callback(null, obj);
      }.bind(this)
    );
  }

  public getEnums(enumName, callback) {
    if (this._type === "local") {
      return callback(null, []);
    } else {
      enumName = enumName ? enumName + "." : "";

      // Read all enums
      this._socket.emit(
        "getObjectView",
        "system",
        "enum",
        {
          startkey: "enum." + enumName,
          endkey: "enum." + enumName + "\u9999"
        },
        function(err, res) {
          if (err) {
            callback(err);
            return;
          }
          var enums = {};
          for (var i = 0; i < res.rows.length; i++) {
            var obj = res.rows[i].value;
            enums[obj._id] = obj;
          }
          callback(null, enums);
        }.bind(this)
      );
    }
  }

  public addObject(objId, obj, callback) {
    if (!this._isConnected) {
      console.log("No connection!");
      return;
    }
    //socket.io
    if (this._socket === null) {
      console.log("socket.io not initialized");
      return;
    }
  }

  public delObject(objId) {
    if (!this._checkConnection("delObject", arguments)) return;

    this._socket.emit("delObject", objId);
  }

  public httpGet(url, callback) {
    if (!this._isConnected) {
      console.log("No connection!");
      return;
    }
    //socket.io
    if (this._socket === null) {
      console.log("socket.io not initialized");
      return;
    }
    this._socket.emit("httpGet", url, function(data) {
      if (callback) callback(data);
    });
  }

  public logError(errorText) {
    console.log("Error: " + errorText);
    if (!this._isConnected) {
      //console.log('No connection!');
      return;
    }
    //socket.io
    if (this._socket === null) {
      console.log("socket.io not initialized");
      return;
    }
    this._socket.emit("log", "error", "Addon DashUI  " + errorText);
  }

  private _queueCmdIfRequired(func: string, args) {
    var that = this;
    if (!this._isAuthDone) {
      // Queue command
      this._cmdQueue.push({
        func: func,
        args: args
      });

      if (!this._authRunning) {
        this._authRunning = true;
        // Try to read version
        this._checkAuth(function(version) {
          // If we have got version string, so there is no authentication, or we are authenticated
          that._authRunning = false;
          if (version) {
            that._isAuthDone = true;
            // Repeat all stored requests
            var __cmdQueue = that._cmdQueue;
            // Trigger GC
            that._cmdQueue = null;
            that._cmdQueue = [];
            debugger;
            for (var t = 0, len = __cmdQueue.length; t < len; t++) {
              that[__cmdQueue[t][func]].apply(that, __cmdQueue[t][args]);
            }
          } else {
            // Auth required
            that._isAuthRequired = true;
            // What for AuthRequest from server
          }
        });
      }
    } else {
      return false;
    }
  }

  public authenticate(user, password, salt) {
    this._authRunning = true;

    if (user !== undefined) {
      this._authInfo = {
        user: user,
        hash: password + salt,
        salt: salt
      };
    }

    if (!this._isConnected) {
      console.log("No connection!");
      return;
    }

    if (!this._authInfo) {
      console.log("No credentials!");
    }
  }

  public getConfig(callback) {
    if (!this._checkConnection("getConfig", arguments)) return;

    var that = this;
    this._socket.emit("getObject", "system.config", function(err, obj) {
      if (callback && obj && obj.common) {
        callback(null, obj.common);
      } else {
        callback("Cannot read language");
      }
    });
  }

  public sendCommand(instance, command, data, ack) {
    this.setState(
      this.namespace + ".control.instance",
      {
        val: instance || "notdefined",
        ack: true
      },
      () => {}
    );
    this.setState(
      this.namespace + ".control.data",
      {
        val: data,
        ack: true
      },
      () => {}
    );
    this.setState(
      this.namespace + ".control.command",
      {
        val: command,
        ack: ack === undefined ? true : ack
      },
      () => {}
    );
  }

  private _detectViews(projectDir, callback) {
    this.readDir("/" + this.namespace + "/" + projectDir, function(err, dirs) {
      // find vis-views.json
      for (var f = 0; f < dirs.length; f++) {
        if (
          dirs[f].file === "vis-views.json" &&
          (!dirs[f].acl || dirs[f].acl.read)
        ) {
          return callback(err, {
            name: projectDir,
            readOnly: dirs[f].acl && !dirs[f].acl.write,
            mode: dirs[f].acl ? dirs[f].acl.permissions : 0
          });
        }
      }
      callback(err);
    });
  }

  public readProjects(callback) {
    var that = this;
    this.readDir("/" + this.namespace, function(err, dirs) {
      var result = [];
      var count = 0;
      for (var d = 0; d < dirs.length; d++) {
        if (dirs[d].isDir) {
          count++;
          that._detectViews(dirs[d].file, function(subErr, project) {
            if (project) result.push(project);

            err = err || subErr;
            if (!--count) callback(err, result);
          });
        }
      }
    });
  }

  public chmodProject(projectDir, mode, callback) {
    //socket.io
    if (this._socket === null) {
      console.log("socket.io not initialized");
      return;
    }
    this._socket.emit(
      "chmodFile",
      this.namespace,
      projectDir + "*",
      {
        mode: mode
      },
      function(err, data) {
        if (callback) callback(err, data);
      }
    );
  }

  public getHistory(id, options, callback) {
    if (!this._checkConnection("getHistory", arguments)) return;

    if (!options) options = {};
    if (!options.timeout) options.timeout = 2000;

    var timeout = setTimeout(function() {
      timeout = null;
      callback("timeout");
    }, options.timeout);
    this._socket.emit("getHistory", id, options, function(err, result) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      callback(err, result);
    });
  }

  public getLiveHost(cb) {
    var that = this;
    this._socket.emit(
      "getObjectView",
      "system",
      "host",
      {
        startkey: "system.host.",
        endkey: "system.host.\u9999"
      },
      function(err, res) {
        var _hosts = [];
        for (var h = 0; h < res.rows.length; h++) {
          _hosts.push(res.rows[h].id + ".alive");
        }
        if (!_hosts.length) {
          cb("");
          return;
        }
        that.getStates(_hosts, function(err, states) {
          for (var h in states) {
            if (states[h].val) {
              const return_value = h.substring(0, h.length - ".alive".length);
              cb(return_value);
              return;
            }
          }
          cb("");
        });
      }
    );
  }

  public readDirAsZip(project, useConvert, callback) {
    if (!callback) {
      callback = useConvert;
      useConvert = undefined;
    }
    if (!this._isConnected) {
      console.log("No connection!");
      return;
    }
    //socket.io
    if (this._socket === null) {
      console.log("socket.io not initialized");
      return;
    }
    if (project.match(/\/$/))
      project = project.substring(0, project.length - 1);
    var that = this;
    this.getLiveHost(function(host) {
      if (!host) {
        window.alert("No active host found");
        return;
      }
      // to do find active host
      that._socket.emit(
        "sendToHost",
        host,
        "readDirAsZip",
        {
          id: that.namespace,
          name: project || "main",
          options: {
            settings: useConvert
          }
        },
        function(data) {
          if (data.error) console.error(data.error);
          if (callback) callback(data.error, data.data);
        }
      );
    });
  }

  public writeDirAsZip(project, base64, callback) {
    if (!this._isConnected) {
      console.log("No connection!");
      return;
    }
    //socket.io
    if (this._socket === null) {
      console.log("socket.io not initialized");
      return;
    }
    if (project.match(/\/$/))
      project = project.substring(0, project.length - 1);
    var that = this;
    this.getLiveHost(function(host) {
      if (!host) {
        window.alert("No active host found");
        return;
      }
      that._socket.emit(
        "sendToHost",
        host,
        "writeDirAsZip",
        {
          id: that.namespace,
          name: project || "main",
          data: base64
        },
        function(data) {
          if (data.error) console.error(data.error);
          if (callback) callback(data.error);
        }
      );
    });
  }
}
