/***********************
 *@name JS
 *@author Jo.gel
 *@date 2017/9/7
 ***********************/
var http = require('http')
var qs = require('querystring')
var cheerio = require('cheerio')
var fs = require('fs') //文件系统
var charset = require('superagent-charset');//转移模块
// var superAgent = charset(require('superagent')) //ajax api http 库 gb2312 或者gbk 的页面，需要  配合charset
var superAgent = require('superagent') //ajax api http 库
var async = require('async')


var htmlHeader = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, sdch',
  'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6',
  'Connection': 'keep-alive',
  'Cookie': 'Hm_lvt_ac168fe809d6bd1c9e16493d086e741e=1504783365; Hm_lpvt_ac168fe809d6bd1c9e16493d086e741e=1504783365; bdshare_firstime=1504783365467',
  'Host': 'www.80txt.com',
  'Referer': 'http://www.80txt.com/txtml_23687.html',
  'Upgrade-Insecure-Requests': 1,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'
}
var targetNovelSite = 'http://www.80txt.com/txtml_23687.html';

/*****************************************
 * async 写法
 * **************************************/

/*
* 因为取不到html 则重新去get title href 的内容
* */
var __function__ = {

  //1 重新去取内容
  againGET: function (url, header) {
    superAgent
      .get(url)
      .set(header)
      .end(function (err, res) {
        return res
      })
  }
}

async.waterfall([
  function (callback) {
    var titleData = []
    var htmlContent = '';//判断是否有内容
    superAgent
      .get(targetNovelSite)
      .set(htmlHeader)
      .end(function (err, res) {
        //先组装title + href
        htmlContent = res.text;
        if (htmlContent) {
          var $ = cheerio.load(res['text'])
          var chapters = $('#yulan').find('li');
          chapters.each(function (item) {
            var chapter = $(this);
            var chapterTargetText = chapter.find('a').text();
            var chapterTargetHref = chapter.find('a').attr('href')
            var chapterData = {
              title: chapterTargetText,
              href: chapterTargetHref
            };
            titleData.push(chapterData);
          });

          callback(null, titleData);
        } else {
          //如果取不到，则再去取
          // htmlContent= __function__.againGET(targetNovelSite,htmlHeader)

          //暂时不做
          fs.appendFile('zeroAge.txt', '第一次取值就失败' + '\n', function (err) {
            if (err) {
              throw err
            }
          })
        }
      })
  }

], function (err, titleData) {
  if (titleData) {
    titleData.forEach(function (item) {
      // fs.appendFile('titel.txt', item['title'] + '\n' + item['href']  + '\n', function (err) {
      //   if (err) {
      //     throw err
      //   }
      // })
      if (item['title']) {
        superAgent
          .get(item['href'])
          .set(htmlHeader)
          .end(function (err2, res2) {
            var html2 = res2.text
            if (html2) {
              var $ = cheerio.load(html2);
              var single = $('#content').text();//单篇文章内容
              fs.appendFile('zeroAge.txt', item['title'] + '\n' + item['href'] + single + '\n', function (err) {
                if (err) {
                  throw err
                }
              })

            } else {
              console.info('文章获取失败');
            }
          })

      } else {
        fs.appendFile('zeroAge.txt', 'title 不存在' + '\n', function (err) {
          if (err) {
            throw err
          }
        })
      }
    })


  } else {
    fs.appendFile('zeroAge.txt', '在最后的取值中失败，没有找到singleData' + '\n', function (err) {
      if (err) {
        throw err
      }
    })
  }
})

