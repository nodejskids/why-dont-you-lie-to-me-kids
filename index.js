const botconfig = require("./botconfig.json");
const Discord = require("discord.js");
const fs = require("fs");
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
let xp = require("./xp.json")
let cooldown = new Set();
let cdseconds = 3;

fs.readdir("./commands/", (err, files) => {

  if(err) console.log(err);

  let jsfile = files.filter(f => f.split(".").pop() === "js")
  if(jsfile.length <= 0){
    console.log("Couldn't find commands.");
    return;
  }

  jsfile.forEach((f, i) =>{
    let props = require(`./commands/${f}`);
    console.log(`${f} loaded!`);
    bot.commands.set(props.help.name, props);
  });

});



bot.on("ready", async () => {
   console.log(`${bot.user.username} is online!`);
   bot.user.setActivity("Say ;help for help");
});

bot.on("message", async message => {

  if(message.author.bot) return;
  if(message.channel.type === "dm") return;

  let prefixes = JSON.parse(fs.readFileSync("./prefixes.json", "utf8"));

  if(!prefixes[message.guild.id]){
   prefixes[message.guild.id] = {
      prefixes: botconfig.prefix
   };
  }

  let xpAdd = Math.floor(Math.random() * 7) + 8;

  if(!xp[message.author.id]){
  xp[message.author.id] = {
   xp: 0,
   level: 1
   };
  }


  let curxp = xp[message.author.id].xp;
  let curlvl = xp[message.author.id].level;
  let nxtLvl = xp[message.author.id].level * 300;
  xp[message.author.id].xp = curxp + xpAdd;
  if(nxtLvl <= xp[message.author.id].xp){
  xp[message.author.id].level = curlvl + 1;
   let lvlup = new Discord.RichEmbed()
   .setTitle("Level up")
   .setColor("#3700ff")
   .addField("New Level", curlvl + 1);

   message.channel.send(`<@${message.author.id}>`,lvlup);
  }

  fs.writeFile("./xp.json", JSON.stringify(xp), (err) => {
   if(err) console.log(err)
  });
  let prefix = prefixes[message.guild.id].prefixes;
  if(!message.content.startsWith(prefix)) return;
  if(cooldown.has(message.author.id)){
   message.reply("You must wait 3 seconds before saying any more commands.")
  }
  if(!message.member.hasPermission("ADMINISTRATOR")){
   cooldown.add(message.author.id);
  }
  //let prefix = botconfig.prefix;
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0];
  let args = messageArray.slice(1);

  let commandfile = bot.commands.get(cmd.slice(prefix.length));
  if(commandfile) commandfile.run(bot,message,args);

  setTimeout(() => {
   cooldown.delete(message.author.id)
 }, cdseconds * 1000)
});




bot.login(botconfig.token);
