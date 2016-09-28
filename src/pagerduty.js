var SchedulesMatching, async, formatIncident, incidentsForEmail, inspect, moment, pagerDutyIntegrationPost, pagerDutyUserId, pagerduty, reassignmentParametersForUserOrScheduleOrEscalationPolicy, updateIncidents, withCurrentOncall, withCurrentOncallId, withCurrentOncallUser, withScheduleMatching;

pagerduty = require('.pdfunctions.js');

async = require('async');

inspect = require('util').inspect;

moment = require('moment-timezone');

fs = require('fs');

pagerDutyUserId = process.env.HUBOT_PAGERDUTY_USER_ID;

module.exports = function(robot) {
  var campfireUserToPagerDutyUser, pagerDutyIntegrationAPI, parseIncidentNumbers, reassignmentParametersForUserOrScheduleOrEscalationPolicy;
  robot.respond(/pager( me)?$/i, function(msg) {
    var cmd, cmds;
    if (pagerduty.missingEnvironmentForApi(msg)) {
      return;
    }
    campfireUserToPagerDutyUser(msg, msg.message.user, function(user) {
      var emailNote;
      emailNote = msg.message.user.pagerdutyEmail ? "You've told me your PagerDuty email is " + msg.message.user.pagerdutyEmail : msg.message.user.email_address ? "I'm assuming your PagerDuty email is " + msg.message.user.email_address + ". Change it with `" + robot.name + " pager me as you@yourdomain.com`" : void 0;
      if (user) {
        return msg.send("I found your PagerDuty user https://" + pagerduty.subdomain + ".pagerduty.com" + user.user_url + ", " + emailNote);
      } else {
        return msg.send("I couldn't find your user :( " + emailNote);
      }
    });
    cmds = robot.helpCommands();
    cmds = (function() {
      var i, len, results1;
      results1 = [];
      for (i = 0, len = cmds.length; i < len; i++) {
        cmd = cmds[i];
        if (cmd.match(/hubot (pager |who's on call)/)) {
          results1.push(cmd);
        }
      }
      return results1;
    })();
    return msg.send(cmds.join("\n"));
  });
  robot.respond(/pager(?: me)? as (.*)$/i, function(msg) {
    var email;
    email = msg.match[1];
    msg.message.user.pagerdutyEmail = email;
    return msg.send("Okay, I'll remember your PagerDuty email is " + email);
  });
  robot.respond(/pager forget me$/i, function(msg) {
    msg.message.user.pagerdutyEmail = void 0;
    msg.send("Okay, I've forgotten your PagerDuty email");
    return pagerduty.getSchedules(query, function(err, schedules) {
      var buffer, i, len, schedule;
      if (err != null) {
        robot.emit('error', err, msg);
        return;
      }
      buffer = '';
      if (schedules.length > 0) {
        for (i = 0, len = schedules.length; i < len; i++) {
          schedule = schedules[i];
          buffer += "* " + schedule.name + " - https://" + pagerduty.subdomain + ".pagerduty.com/schedules#" + schedule.id + "\n";
        }
        msg.send(buffer);
      } else {
        msg.send('No schedules found!');
      }
      pagerduty.get("/schedules/" + scheduleId + "/" + thing, query, function(err, json) {
        var endTime, entries, entry, j, len1, sortedEntries, startTime;
        if (err != null) {
          robot.emit('error', err, msg);
          return;
        }
        entries = json.entries || json.overrides;
        if (entries) {
          sortedEntries = entries.sort(function(a, b) {
            return moment(a.start).unix() - moment(b.start).unix();
          });
          buffer = "";
          for (j = 0, len1 = sortedEntries.length; j < len1; j++) {
            entry = sortedEntries[j];
            startTime = moment(entry.start).tz(timezone).format();
            endTime = moment(entry.end).tz(timezone).format();
            if (entry.id) {
              buffer += "* (" + entry.id + ") " + startTime + " - " + endTime + " " + entry.user.name + "\n";
            } else {
              buffer += "* " + startTime + " - " + endTime + " " + entry.user.name + "\n";
            }
          }
          if (buffer === "") {
            return msg.send("None found!");
          } else {
            return msg.send(buffer);
          }
        } else {
          return msg.send("None found!");
        }
      });
      return pagerduty.getSchedules(function(err, schedules) {
        var renderSchedule;
        if (err != null) {
          robot.emit('error', err, msg);
          return;
        }
        if (schedules.length > 0) {
          renderSchedule = function(schedule, cb) {
            return pagerduty.get("/schedules/" + schedule.id + "/entries", query, function(err, json) {
              var endTime, entries, entry, j, len1, sortedEntries, startTime;
              if (err != null) {
                cb(err);
              }
              entries = json.entries;
              if (entries) {
                sortedEntries = entries.sort(function(a, b) {
                  return moment(a.start).unix() - moment(b.start).unix();
                });
                buffer = "";
                for (j = 0, len1 = sortedEntries.length; j < len1; j++) {
                  entry = sortedEntries[j];
                  if (userId === entry.user.id) {
                    startTime = moment(entry.start).tz(timezone).format();
                    endTime = moment(entry.end).tz(timezone).format();
                    buffer += "* " + startTime + " - " + endTime + " " + entry.user.name + " (" + schedule.name + ")\n";
                  }
                }
                return cb(null, buffer);
              }
            });
          };
          async.map(schedules, renderSchedule, function(err, results) {
            if (err != null) {
              robot.emit('error', err, msg);
              return;
            }
            return msg.send(results.join(""));
          });
        } else {
          msg.send('No schedules found!');
        }
        return withCurrentOncall(msg, matchingSchedule, function(old_username, schedule) {
          var data;
          data = {
            'override': override
          };
          return pagerduty.post("/schedules/" + schedule.id + "/overrides", data, function(err, json) {
            var end, start;
            if (err != null) {
              robot.emit('error', err, msg);
              return;
            }
            if (json.override) {
              start = moment(json.override.start);
              end = moment(json.override.end);
              return msg.send("Rejoice, " + old_username + "! " + json.override.user.name + " has the pager on " + schedule.name + " until " + (end.format()));
            }
          });
        });
      });
    });
  });
  robot.respond(/(pager|major)( me)? schedules( (.+))?$/i, function(msg) {
    var query;
    query = {};
    if (msg.match[4]) {
      query['query'] = msg.match[4];
    }
    if (pagerduty.missingEnvironmentForApi(msg)) {
      return;
    }
    return pagerduty.getSchedules(query, function(err, schedules) {
      var buffer, i, len, schedule;
      if (err != null) {
        robot.emit('error', err, msg);
        return;
      }
      buffer = '';
      if (schedules.length > 0) {
        for (i = 0, len = schedules.length; i < len; i++) {
          schedule = schedules[i];
          buffer += "* " + schedule.name + " - https://" + pagerduty.subdomain + ".pagerduty.com/schedules#" + schedule.id + "\n";
        }
        return msg.send(buffer);
      } else {
        return msg.send('No schedules found!');
      }
    });
  });
  robot.respond(/who(?:’s|'s|s| is|se)? (?:on call|oncall|on-call)(?: (?:for )?(.*?)(?:\?|$))?/i, function(msg) {
    var messages, renderSchedule, scheduleName;
    if (pagerduty.missingEnvironmentForApi(msg)) {
      return;
    }
    scheduleName = msg.match[1];
    if (scheduleName === null) {
      scheduleName = "sn.";
    } else if (/sn./i.test(scheduleName)) {
      scheduleName = scheduleName;
    } else if (!/sn./i.test(scheduleName)) {
      scheduleName = "sn." + scheduleName;
    }
    messages = [];
    renderSchedule = function(s, cb) {
      return withCurrentOncall(msg, s, function(username, schedule) {
        return cb(null, messages.push("* " + schedule.name + " on call person is " + username));
      });
    };
    setTimeout((function() {
      return msg.send(messages.join("\n"));
    }), 5000);
    if (scheduleName != null) {
      return withScheduleMatching(msg, scheduleName.replace('undefined', ''), function(s) {
        return renderSchedule(s, function(err, text) {
          if (err != null) {
            robot.emit('error');
            return;
          }
          return msg.send(text);
        });
      });
    } else {
      return pagerduty.getSchedules(function(err, schedules) {
        if (err != null) {
          robot.emit('error', err, msg);
          return;
        }
        if (schedules.length > 0) {
          return async.map(schedules, renderSchedule, function(err, results) {
            if (err != null) {
              robot.emit('error', err, msg);
              return;
            }
            return msg.send(results.join("\n"));
          });
        } else {
          return msg.send('No schedules found!');
        }
      });
    }
  });
  reassignmentParametersForUserOrScheduleOrEscalationPolicy = function(msg, string, cb) {
    var campfireUser;
    if (campfireUser = robot.brain.userForName(string)) {
      return campfireUserToPagerDutyUser(msg, campfireUser, function(user) {
        return cb({
          assigned_to_user: user.id,
          name: user.name
        });
      });
    } else {
      return pagerduty.get("/escalation_policies", {
        query: string
      }, function(err, json) {
        var escalationPolicy, matchingExactly, ref, ref1;
        if (err != null) {
          robot.emit('error', err, msg);
          return;
        }
        escalationPolicy = null;
        if ((json != null ? (ref = json.escalation_policies) != null ? ref.length : void 0 : void 0) === 1) {
          escalationPolicy = json.escalation_policies[0];
        } else if ((json != null ? (ref1 = json.escalation_policies) != null ? ref1.length : void 0 : void 0) > 1) {
          matchingExactly = json.escalation_policies.filter(function(es) {
            return es.name.toLowerCase() === string.toLowerCase();
          });
          if (matchingExactly.length === 1) {
            escalationPolicy = matchingExactly[0];
          }
        }
        if (escalationPolicy != null) {
          return cb({
            escalation_policy: escalationPolicy.id,
            name: escalationPolicy.name
          });
        } else {
          return SchedulesMatching(msg, string, function(schedule) {
            if (schedule) {
              return withCurrentOncallUser(msg, schedule, function(user, schedule) {
                return cb({
                  assigned_to_user: user.id,
                  name: user.name
                });
              });
            } else {
              return cb();
            }
          });
        }
      });
    }
  };
  robot.respond(/(pager|major)( me)? incident (.*)$/i, function(msg) {
    msg.finish();
    if (pagerduty.missingEnvironmentForApi(msg)) {
      return;
    }
    return pagerduty.getIncident(msg.match[3], function(err, incident) {
      if (err != null) {
        robot.emit('error', err, msg);
        return;
      }
      return msg.send(formatIncident(incident));
    });
  });
  pagerDutyIntegrationAPI = function(msg, cmd, description, key, cb) {
    var data, pagerDutyServiceApiKey;
    pagerDutyServiceApiKey = key;
    if (pagerDutyServiceApiKey == null) {
      msg.send("PagerDuty API service key is missing.");
      msg.send("Ensure that HUBOT_PAGERDUTY_SERVICE_API_KEY is set.");
      return;
    }
    switch (cmd) {
      case "trigger":
        data = JSON.stringify({
          service_key: pagerDutyServiceApiKey,
          event_type: "trigger",
          description: description
        });
        return pagerDutyIntegrationPost(msg, data, function(json) {
          return cb(json);
        });
    }
  };
  robot.respond(/(pager|major)( me)? (?:trigger|hail|ping|call|page) ([\w\-]+) (.+)$/i, function(msg) {
    var group, query, reason, user;
    user = msg.message.user.name;
    group = msg.match[3];
    reason = msg.match[4];
    query = {};
    if (msg.match[3]) {
      query['query'] = msg.match[3];
    }
    return pagerduty.get("/services", query, function(err, json) {
      var buffer, description, i, len, pagerDutyServiceApiKey, service, services;
      if (err != null) {
        robot.emit('error', err, msg);
        return;
      }
      buffer = '';
      services = json.services;
      if (services.length > 0) {
        for (i = 0, len = services.length; i < len; i++) {
          service = services[i];
          buffer += "" + service.service_key;
        }
        msg.send(buffer);
        pagerDutyServiceApiKey = buffer;
        description = reason + " - @" + user;
        return pagerDutyIntegrationAPI(msg, "trigger", description, pagerDutyServiceApiKey, function(json) {
          return msg.reply("Sucessfully Ping");
        });
      } else {
        msg.send('No services found!');
        return msg.reply("Error detail " + json.message);
      }
    });
  });
  robot.respond(/(pager|major)( me)? service ([\w\-]+) (.+)$/i, function(msg) {
    var query;
    query = {};
    if (msg.match[4]) {
      query['query'] = msg.match[4];
    }
    return pagerduty.get("/services", query, function(err, json) {
      var buffer, i, len, service, services;
      if (err != null) {
        robot.emit('error', err, msg);
        return;
      }
      buffer = '';
      services = json.services;
      if (services.length > 0) {
        for (i = 0, len = services.length; i < len; i++) {
          service = services[i];
          buffer += service.name + " " + service.service_key + "\n";
        }
        return msg.send(buffer);
      } else {
        return msg.send('No services found!');
      }
    });
  });
  robot.respond(/(pager|major)( me)? services$/i, function(msg) {
    if (pagerduty.missingEnvironmentForApi(msg)) {
      return;
    }
    return pagerduty.get("/services", {}, function(err, json) {
      var buffer, i, len, service, services;
      if (err != null) {
        robot.emit('error', err, msg);
        return;
      }
      buffer = '';
      services = json.services;
      if (services.length > 0) {
        for (i = 0, len = services.length; i < len; i++) {
          service = services[i];
          buffer += "* " + service.id + ":  " + service.service_key + " " + service.name + "  (" + service.status + ") - https://" + pagerduty.subdomain + ".pagerduty.com/services/" + service.id + "\n";
        }
        return msg.send(buffer);
      } else {
        return msg.send('No services found!');
      }
    });
  });
  parseIncidentNumbers = function(match) {
    return match.split(/[ ,]+/).map(function(incidentNumber) {
      return parseInt(incidentNumber);
    });
  };
  return campfireUserToPagerDutyUser = function(msg, user, required, cb) {
    var addressee, email, possessive, speakerEmail;
    if (typeof required === 'function') {
      cb = required;
      required = true;
    }
    email = user.pagerdutyEmail || user.email_address || process.env.HUBOT_PAGERDUTY_TEST_EMAIL;
    speakerEmail = msg.message.user.pagerdutyEmail || msg.message.user.email_address;
    if (!email) {
      if (!required) {
        cb(null);
        return;
      } else {
        possessive = email === speakerEmail ? "your" : user.name + "'s";
        addressee = email === speakerEmail ? "you" : "" + user.name;
        msg.send("Sorry, I can't figure out " + possessive + " email address :( Can " + addressee + " tell me with `" + robot.name + " pager me as you@yourdomain.com`?");
        return;
      }
    }
    return pagerduty.get("/users", {
      query: email
    }, function(err, json) {
      if (err != null) {
        robot.emit('error', err, msg);
        return;
      }
      if (json.users.length !== 1) {
        if (json.users.length === 0 && !required) {
          cb(null);
          return;
        } else {
          msg.send("Sorry, I expected to get 1 user back for " + email + ", but got " + json.users.length + " :sweat:. If your PagerDuty email is not " + email + " use `/pager me as " + email + "`");
          return;
        }
      }
      return cb(json.users[0]);
    });
  };
};

SchedulesMatching = function(msg, q, cb) {
  var query;
  query = {
    query: q
  };
  return pagerduty.getSchedules(query, function(err, schedules) {
    if (err != null) {
      robot.emit('error', err, msg);
      return;
    }
    return cb(schedules);
  });
};

withScheduleMatching = function(msg, q, cb) {
  return SchedulesMatching(msg, q, function(schedules) {
    var i, len, schedule;
    if ((schedules != null ? schedules.length : void 0) < 1) {
      msg.send("I couldn't find any schedules matching " + q);
    } else {
      for (i = 0, len = schedules.length; i < len; i++) {
        schedule = schedules[i];
        cb(schedule);
      }
    }
  });
};

reassignmentParametersForUserOrScheduleOrEscalationPolicy = function(msg, string, cb) {
  var campfireUser;
  if (campfireUser = robot.brain.userForName(string)) {
    return campfireUserToPagerDutyUser(msg, campfireUser, function(user) {
      return cb({
        assigned_to_user: user.id,
        name: user.name
      });
    });
  } else {
    return pagerduty.get("/escalation_policies", {
      query: string
    }, function(err, json) {
      var escalationPolicy, matchingExactly, ref, ref1;
      if (err != null) {
        robot.emit('error', err, msg);
        return;
      }
      escalationPolicy = null;
      if ((json != null ? (ref = json.escalation_policies) != null ? ref.length : void 0 : void 0) === 1) {
        escalationPolicy = json.escalation_policies[0];
      } else if ((json != null ? (ref1 = json.escalation_policies) != null ? ref1.length : void 0 : void 0) > 1) {
        matchingExactly = json.escalation_policies.filter(function(es) {
          return es.name.toLowerCase() === string.toLowerCase();
        });
        if (matchingExactly.length === 1) {
          escalationPolicy = matchingExactly[0];
        }
      }
      if (escalationPolicy != null) {
        return cb({
          escalation_policy: escalationPolicy.id,
          name: escalationPolicy.name
        });
      } else {
        return SchedulesMatching(msg, string, function(schedule) {
          if (schedule) {
            return withCurrentOncallUser(msg, schedule, function(user, schedule) {
              return cb({
                assigned_to_user: user.id,
                name: user.name
              });
            });
          } else {
            return cb();
          }
        });
      }
    });
  }
};

withCurrentOncall = function(msg, schedule, cb) {
  return withCurrentOncallUser(msg, schedule, function(user, s) {
    return cb(user.name, s);
  });
};

withCurrentOncallId = function(msg, schedule, cb) {
  return withCurrentOncallUser(msg, schedule, function(user, s) {
    return cb(user.id, user.name, s);
  });
};

withCurrentOncallUser = function(msg, schedule, cb) {
  var now, oneHour, query, scheduleId;
  oneHour = moment().add(1, 'hours').format();
  now = moment().format();
  scheduleId = schedule.id;
  if (schedule instanceof Array && schedule[0]) {
    scheduleId = schedule[0].id;
  }
  if (!scheduleId) {
    msg.send("Unable to retrieve the schedule. Use 'pager schedules' to list all schedules.");
    return;
  }
  query = {
    since: now,
    until: oneHour,
    overflow: 'true'
  };
  return pagerduty.get("/schedules/" + scheduleId + "/entries", query, function(err, json) {
    if (err != null) {
      robot.emit('error', err, msg);
      return;
    }
    if (json.entries && json.entries.length > 0) {
      return cb(json.entries[0].user, schedule);
    }
  });
};

formatIncident = function(inc) {
  var assigned_to, names, summary;
  summary = inc.trigger_summary_data ? inc.trigger_summary_data.pd_nagios_object === 'service' ? inc.trigger_summary_data.HOSTNAME + "/" + inc.trigger_summary_data.SERVICEDESC : inc.trigger_summary_data.pd_nagios_object === 'host' ? inc.trigger_summary_data.HOSTNAME + "/" + inc.trigger_summary_data.HOSTSTATE : inc.trigger_summary_data.subject ? inc.trigger_summary_data.subject : inc.trigger_summary_data.description ? inc.trigger_summary_data.description : "" : "";
  assigned_to = inc.assigned_to ? (names = inc.assigned_to.map(function(assignment) {
    return assignment.object.name;
  }), "- assigned to " + (names.join(', '))) : "";
  return inc.incident_number + ": " + inc.created_on + " " + summary + " " + assigned_to + "\n";
};

updateIncidents = function(msg, incidentNumbers, statusFilter, updatedStatus) {
  return campfireUserToPagerDutyUser(msg, msg.message.user, function(user) {
    var requesterId;
    requesterId = user.id;
    if (!requesterId) {
      return;
    }
    return pagerduty.getIncidents(statusFilter, function(err, incidents) {
      var data, foundIncidents, i, incident, len;
      if (err != null) {
        robot.emit('error', err, msg);
        return;
      }
      foundIncidents = [];
      for (i = 0, len = incidents.length; i < len; i++) {
        incident = incidents[i];
        if (incidentNumbers.indexOf(incident.incident_number) > -1) {
          foundIncidents.push(incident);
        }
      }
      if (foundIncidents.length === 0) {
        return msg.reply("Couldn't find incident(s) " + (incidentNumbers.join(', ')) + ". Use `" + robot.name + " pager incidents` for listing.");
      } else {
        data = {
          requester_id: requesterId,
          incidents: foundIncidents.map(function(incident) {
            return {
              'id': incident.id,
              'status': updatedStatus
            };
          })
        };
        return pagerduty.put("/incidents", data, function(err, json) {
          var buffer;
          if (err != null) {
            robot.emit('error', err, msg);
            return;
          }
          if (json != null ? json.incidents : void 0) {
            buffer = "Incident";
            if (json.incidents.length > 1) {
              buffer += "s";
            }
            buffer += " ";
            buffer += ((function() {
              var j, len1, ref, results1;
              ref = json.incidents;
              results1 = [];
              for (j = 0, len1 = ref.length; j < len1; j++) {
                incident = ref[j];
                results1.push(incident.incident_number);
              }
              return results1;
            })()).join(", ");
            buffer += " " + updatedStatus;
            return msg.reply(buffer);
          } else {
            return msg.reply("Problem updating incidents " + (incidentNumbers.join(',')));
          }
        });
      }
    });
  });
};

pagerDutyIntegrationPost = function(msg, json, cb) {
  return msg.http('https://events.pagerduty.com/generic/2010-04-15/create_event.json').header("content-type", "application/json").header("content-length", json.length).post(json)(function(err, res, body) {
    switch (res.statusCode) {
      case 200:
        json = JSON.parse(body);
        return cb(json);
      default:
        console.log(res.statusCode);
        return console.log(body);
    }
  });
};

incidentsForEmail = function(incidents, userEmail) {
  return incidents.filter(function(incident) {
    return incident.assigned_to.some(function(assignment) {
      return assignment.object.email === userEmail;
    });
  });
};
