var HttpClient, PagerDutyError, pagerDutyApiKey, pagerDutyBaseUrl, pagerDutyServices, pagerDutySubdomain, pagerNoop,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

HttpClient = require('scoped-http-client');

pagerDutyApiKey = process.env.HUBOT_PAGERDUTY_API_KEY;

pagerDutySubdomain = process.env.HUBOT_PAGERDUTY_SUBDOMAIN;

pagerDutyBaseUrl = "https://" + pagerDutySubdomain + ".pagerduty.com/api/v1";

pagerDutyServices = process.env.HUBOT_PAGERDUTY_SERVICES;

pagerNoop = process.env.HUBOT_PAGERDUTY_NOOP;

if (pagerNoop === "false" || pagerNoop === "off") {
  pagerNoop = false;
}

PagerDutyError = (function(superClass) {
  extend(PagerDutyError, superClass);

  function PagerDutyError() {
    return PagerDutyError.__super__.constructor.apply(this, arguments);
  }

  return PagerDutyError;

})(Error);

module.exports = {
  http: function(path) {
    return HttpClient.create("" + pagerDutyBaseUrl + path).headers({
      Authorization: "Token token=" + pagerDutyApiKey,
      Accept: 'application/json'
    });
  },
  missingEnvironmentForApi: function(msg) {
    var missingAnything;
    missingAnything = false;
    if (pagerDutySubdomain == null) {
      msg.send("PagerDuty Subdomain is missing:  Ensure that HUBOT_PAGERDUTY_SUBDOMAIN is set.");
      missingAnything |= true;
    }
    if (pagerDutyApiKey == null) {
      msg.send("PagerDuty API Key is missing:  Ensure that HUBOT_PAGERDUTY_API_KEY is set.");
      missingAnything |= true;
    }
    return missingAnything;
  },
  get: function(url, query, cb) {
    if (typeof query === 'function') {
      cb = query;
      query = {};
    }
    if ((pagerDutyServices != null) && url.match(/\/incidents/)) {
      query['service'] = pagerDutyServices;
    }
    return this.http(url).query(query).get()(function(err, res, body) {
      var json_body;
      if (err != null) {
        cb(err);
        return;
      }
      json_body = null;
      switch (res.statusCode) {
        case 200:
          json_body = JSON.parse(body);
          break;
        default:
          cb(new PagerDutyError(res.statusCode + " back from " + url));
      }
      return cb(null, json_body);
    });
  },
  put: function(url, data, cb) {
    var json;
    if (pagerNoop) {
      console.log("Would have PUT " + url + ": " + (inspect(data)));
      return;
    }
    json = JSON.stringify(data);
    return this.http(url).header("content-type", "application/json").header("content-length", json.length).put(json)(function(err, res, body) {
      var json_body;
      if (err != null) {
        callback(err);
        return;
      }
      json_body = null;
      switch (res.statusCode) {
        case 200:
          json_body = JSON.parse(body);
          break;
        default:
          return cb(new PagerDutyError(res.statusCode + " back from " + url));
      }
      return cb(null, json_body);
    });
  },
  post: function(url, data, cb) {
    var json;
    if (pagerNoop) {
      console.log("Would have POST " + url + ": " + (inspect(data)));
      return;
    }
    json = JSON.stringify(data);
    return this.http(url).header("content-type", "application/json").header("content-length", json.length).post(json)(function(err, res, body) {
      var json_body;
      if (err != null) {
        return cb(err);
      }
      json_body = null;
      switch (res.statusCode) {
        case 201:
          json_body = JSON.parse(body);
          break;
        default:
          return cb(new PagerDutyError(res.statusCode + " back from " + url));
      }
      return cb(null, json_body);
    });
  },
  "delete": function(url, cb) {
    var auth;
    if (pagerNoop) {
      console.log("Would have DELETE " + url);
      return;
    }
    auth = "Token token=" + pagerDutyApiKey;
    return this.http(url).header("content-length", 0)["delete"]()(function(err, res, body) {
      var json_body, value;
      if (err != null) {
        return cb(err);
      }
      json_body = null;
      switch (res.statusCode) {
        case 204:
        case 200:
          value = true;
          break;
        default:
          console.log(res.statusCode);
          console.log(body);
          value = false;
      }
      return cb(null, value);
    });
  },
  getIncident: function(incident, cb) {
    return this.get("/incidents/" + (encodeURIComponent(incident)), {}, function(err, json) {
      if (err != null) {
        cb(err);
        return;
      }
      return cb(null, json);
    });
  },
  getIncidents: function(status, cb) {
    var query;
    query = {
      status: status,
      sort_by: "incident_number:asc"
    };
    return this.get("/incidents", query, function(err, json) {
      if (err != null) {
        cb(err);
        return;
      }
      return cb(null, json.incidents);
    });
  },
  getSchedules: function(query, cb) {
    if (typeof query === 'function') {
      cb = query;
      query = {};
    }
    return this.get("/schedules", query, function(err, json) {
      if (err != null) {
        cb(err);
        return;
      }
      return cb(null, json.schedules);
    });
  },
  subdomain: pagerDutySubdomain
};
