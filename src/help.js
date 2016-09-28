module.exports = function(robot) {
  return robot.respond(/pd help(.*)$/i, function(msg) {
    var helpMessage = "*PD Help Menu:* \n"
    helpMessage += "pd help - Displays all of the help commands that Hubot knows about \n \
    				pd help <query> - Displays all help commands that match <query> \n \
    				hail <schedule> <msg> - create a new incident with <msg> and assign it the user currently on call for <schedule> \n \
    				pd pager schedules - list schedules \n \
					pd pager schedules <search> - list schedules matching <search> \n \
					pd pager service info <search> - list service matching <search> \n \
					pd pager services - list services \n \
					pd who's on call - return a list of services and who is on call for them \n \
					pd who's on call for <schedule> - return the username of who's on call for any schedule matching <search> \n \
					For more information please visit https://tools.timeinc.net/wiki/display/IOPRIVATE/Hubot+Commands "

  return msg.send(helpMessage);
 });
};
