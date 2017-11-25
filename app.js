var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {

  // render the error page
  res.status(err.status || 500);
});


var path = require("path");
var jsmediatags = require("jsmediatags");
var axios = require("axios")
var fs = require('fs')

//配置远程路径
var remotePath = "/Users/Fan/Music/网易云音乐";

//获取当前目录绝对路径，这里resolve()不传入参数
var filePath = "/Volumes/WALKMAN\ SD/MUSIC/陈粒";

var fileArr = [];
//读取文件目录
fs.readdir(filePath,function(err,files){
  if(err){
      console.log(err);
      return;
  }
  // console.log(files)
  var count = files.length;
  
  files.forEach(function(filename){
      
      //filePath+"/"+filename不能用/直接连接，Unix系统是”/“，Windows系统是”\“
      fs.stat(path.join(filePath,filename),function(err, stats){
          if (err) throw err;

          //文件
          if(stats.isFile()){
            console.log(filename,getdir(filename))
              if(getdir(filename) == 'flac'){
                //如果是你想要的格式,这里直接就可以做你想要的操作
              }
          }else if(stats.isDirectory()){
            //  如果是文件夹
            var name = filename;
            readFile(path.join(filePath,filename),name);
          }
      });
  });
});


//获取后缀名
function getdir(url){
  var arr = url.split('.');
  var len = arr.length;
  return arr[len-1];
}

//获取文件数组
function readFile(readurl,name){
  // console.log(readurl,name);
  var name = name;
  fs.readdir(readurl,function(err,files){
      if(err){console.log(err);return;}
      files.forEach(function(filename){
          fs.stat(path.join(readurl,filename),function(err, stats){
              if (err) throw err;
              //是文件
              if(stats.isFile()){
                  var newUrl=filePath+'/'+name+'/'+filename;
                  var dirUrl = filePath+'/'+name+'/';

                  jsmediatags.read(newUrl, {
                    onSuccess: function(tag) {
                      // console.log(tag);
                      let songData ={
                        url:newUrl,
                        tag:tag,
                        dirUrl,
                        filename:filename.split('.')[0]
                      }
                      let keywordStr ="";
                      if(songData.tag.tags.album) keywordStr+=songData.tag.tags.album +" ";
                      if(songData.tag.tags.artist) keywordStr+=songData.tag.tags.artist+" ";
                      if(songData.tag.tags.title) keywordStr+=songData.tag.tags.title+" ";
                      console.log(songData)
                      // fileArr.push(songData);
                      getLrc(songData,keywordStr)
                      // console.log(fileArr)
                    },
                    onError: function(error) {
                      console.log(':(', error.type, error.info);
                    }
                   });
                   
              //是子目录
              }else if(stats.isDirectory()){
                  var dirName = filename;
                  readFile(path.join(readurl,filename),name+'/'+dirName);
              }
          });
      });
  });
}



async function  getLrc(oFile,keywords){
  let lrc;
  //获取歌曲信息
  let song = await axios.get('http://localhost:3000/search',{params:{keywords,type:1}})
  if(song.data.code==200){

    //选择符合度最高的
    oFile.id = song.data.result.songs[0].id
    lrc= await axios.get('http://localhost:3000/lyric',{params:{id: oFile.id}})
    console.log(oFile)

    //获取歌词
    fs.writeFile(oFile.dirUrl+oFile.filename+'.lrc',lrc.data.lrc.lyric,function(err,data){
      if(err){
        console.log(err);
        return
      }
      console.log(oFile.filename,'歌词写入完毕')
    });

  }
  
  

}
module.exports = app;
