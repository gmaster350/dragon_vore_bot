//Spam prevention
const ed = require('edit-distance');
const oh = require("./objectHelper.js");
const historyLength = 30;
var strikeLength = 5;

var history = {
	<guildid>:{
		<channelid>:{
			<userid>:{
				"messages":[
					{
						messageid:1234567890123456, 
						content:"content", 
						time:"hh:mm"
					}
				],
				"strikes": 0
			}
		}
	}
}

function lev(s1, s2, callback) {
  var insert, remove, update;
  insert = remove = function(node) {
    return 1;
  };
  update = function(s1, s2) {
    return s1 !== s2 ? 1 : 0;
  };
  var res = ed.levenshtein(s1, s2, insert, remove, update).distance;
  
  if(callback)
    callback(res);
  return res;
}

function meanLev(arr,callback){
	var total = 0;
	arr.forEach(function(e1){
		arr.forEach(function(e2){
			lev(e1.content,e2.content,function(res){
				total += res;
			});
		});
	});
	callback(total / (arr.length ** 2));
}

function process(message){
	if (!oh.hasKey(history,message.guild.id))
		history[message.guild.id] = {};
	if (!oh.hasKey(history[message.guild.id],message.channel.id))
		history[message.guild.id][message.channel.id] = {};
	if (!oh.hasKey(history[message.guild.id],[message.channel.id][message.author.id],message.author.id)){
		history[message.guild.id][message.channel.id][message.author.id] = {};
		history[message.guild.id][message.channel.id][message.author.id]["messages"] = [];
		history[message.guild.id][message.channel.id][message.author.id]["strikes"] = 0;
	}
	

	var arr = history[message.guild.id][message.channel.id][message.author.id].messages;
	var stks = history[message.guild.id][message.channel.id][message.author.id].strikes;
	arr.push(
		{
			"messageid":message.id,
			"userid":message.author.id,
			"content":message.content
		}
	);
	if(arr.length > historyLength){
		arr.splice(0,1);
	}
}

module.exports = {
	"process":process
}