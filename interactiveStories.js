//interactive stories module//

const fs = require("fs");
var active = {}; //{userid:[node,node]}
var timeLimit = 600000; //option selection timeout.

class Branch{
	constructor(description="[This is a new branch. use !!branchText to put some text here!]"){
		this.description = description;
		this.options = []; //[<String>,<String>,<String>]
		this.branches = []; //[<Branch>,<Branch>,<Branch>]
	}

	addOption(opt){
		this.branches.push(new Branch());
		this.options.push(opt);
	}
}

var Root;

fs.readFile("interactives.json",function(err,file){
	if(err) console.log(err);
	else if(file.length === 0){
		Root = new Branch("`hint: !!branchText to set a branch's text. !!addOption to make another branch off the current branch`\nThere are a number of marked doors before you, which door do you open?");
		Root.addOption("Dragon");
		fs.writeFile("interactives.json",JSON.stringify(Root),function(err){
			if(err) console.log(err);
		});
	}
	else{
		Root = JSON.parse(file);
	}
});

function getCurrent(userid,nodes=active[userid],branch=Root){
	return nodes.length === 0 ? branch : getCurrent(userid,nodes.slice(1),branch.branches[nodes[0]]);
}

function branchLength(b){
	return Object.keys(b.branches).length;
}

function branchPrint(b){
	var response = b.description + "\n\n[-1] quit\n";
	var ops = b.options;
	for(var i = 0; i < ops.length; i++){
		response += "[" + String(i) + "] " + ops[i] + "\n";
	}
	return response;
}

function messageFilter(m,userid,branch){
	let flag = false;
	let n = Number(m.content);
	if (m.author.id == userid){
		if(!isNaN(n)){
			//options lie between -1 and branchLength-1
			if(n >= branchLength(branch) || n <= -2){
				m.channel.send("Not a valid option!");
			}
			else{
				flag = true;
			}
		}
		else{
			if(!(m.content.startsWith("!!"))){
				m.channel.send("You need to give a number.");
			}
		}
	}
	return flag;
}

function start(message,callback){
	var userid = message.author.id;
	active[userid] = [];
	saveActive();

	callback(branchPrint(Root));

	message.channel.awaitMessages(
		function(m){
			return messageFilter(m,userid,Root);
		},{
			time: timeLimit,
			maxMatches: 1,
			errors: ['time']
		}
	).then(function(collection){
		navigate(collection.first().author.id,collection.first());
	}, function(e){
		if(active[userid] !== []){
			msg.channel.send("Took too long to respond. Please repond to story within 10 minutes.");
		}
	});
}

function navigate(userid,msg){
	var num = Number(msg.content);
	var currentBranch = getCurrent(userid);

	if(num == -1){
		active[userid] = [];
		msg.channel.send("Exited story");
	}
	else {
		active[userid].push(num);
		newBranch = getCurrent(userid);
		msg.channel.send(branchPrint(newBranch));

		saveActive();
		msg.channel.awaitMessages(
			function(m){
				return messageFilter(m,userid,newBranch);
			},{
				time: timeLimit,
				maxMatches: 1,
				errors: ['time']
			}
		).then(function(collection){
			navigate(collection.first().author.id,collection.first());
		}, function(e){
			if(active[userid] !== []){
				msg.channel.send("Took too long to respond. Please repond to story within 10 minutes.");
			}
		});
	}
}

function addOption(message,callback){
	var userid = message.author.id;
	var option = message.content.split(" ").slice(1).join(" ");
	var branch = getCurrent(userid);
	branch.addOption(option);
	callback(branchPrint(branch));
	saveTree();
}

function changeDescription(message,callback){
	var userid = message.author.id;
	var branch = getCurrent(userid);
	if((branch == Root) && (userid != "360352337274863617")){
		callback("Note: You may not change the text of the root branch.");
	}
	else{
		var desc = message.content.split(" ").slice(1).join(" ");
		branch.description = desc;
		callback(branchPrint(branch));
		saveTree();
	}
}

function saveActive(){
	fs.writeFile("../interactiveData.txt",JSON.stringify(active),function(err){
		if(err)console.log(err);
	});
}

function setActive(a){
	active = a;
	fs.writeFile("../interactiveData.txt",JSON.stringify(active),function(err){
		if(err)console.log(err);
	});
}

function addUser(userid){
	if(Object.keys(active).every(function(k){
		return userid != k;
	})){
		active[userid] = [];
		fs.writeFile("../interactiveData.txt",JSON.stringify(active),function(err){
			if(err)console.log(err);
		});
	}
}

function saveTree(){
	fs.writeFile("interactives.json",JSON.stringify(Root),function(err){
		if(err) console.log(err);
	});
}

module.exports = {
	"addOption":addOption,
	"changeDescription":changeDescription,
	"start":start,
	"setActive":setActive
}
