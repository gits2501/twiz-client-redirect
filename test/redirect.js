var Redirect = require('../src/Redirect.js');

var assert = require('assert');
console.log('assert:', assert)
var cb =  function(deliveredData, test){ console.log(deliveredData); test()}; // callback function
var nW = {
    name: 'nw',
    features:'resizable=yes,height=613,width=400,left=400,top=300'
}

var args = {    
  newWindow: nW,
  redirectionUrl: './redirectionPage.html',  // authorization url
  callback_func: cb
}


var rd = new Redirect(args);

test('Redirect', function(t){
   test('Redirection params', function(t){
      t.plan(3);
      t.deepEquals(rd.newWindow, args.newWindow, 'newWindow');
      t.equals(rd.url, args.redirectionUrl, 'redirectionUrl');
      t.deepEquals(rd.callback_func, rd.callback_func, 'callback function')
   })   

  /// mock needed params
  var error;                                         // no error
  var sentData = {
     oauth_token: 'longStringOfAlphaNumerics109', // redirection has to happen (token is present)
     oauth_callback_confirmed: "true"                   // redirection url (callback url) confirmed 
  }


  test('redirect (Promise)', function(t){
     
     var resolve;                 
     var p =  new Promise(function(res, rej){ 
           resolve = res;                         // remember resolve
     })
    
     test('redirection (site scenario)', function(t){
        t.plan(4);

       
        t.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData),undefined,' no Error detected');

        t.deepEquals(rd.requestToken, sentData, 'data received');
     
        t.equals(window.localStorage.requestToken_, sentData.oauth_token, 'oauth_token (request token) saved'); 
        
        p.then(function(o){
           if(o.window) t.ok(typeof o.window === 'object', ' redirected' );
        });

        test('callback url not confirmed by Twitter (site)', function(t){
            t.plan(1);
            sentData.oauth_callback_confirmed = false;  // simulate confirmation with false
            t.throws(rd.redirection.bind(rd, resolve, error, sentData),'throw error (url not confirmed)');
            
            sentData.oauth_callback_confirmed = "true"; // return initial value
     
        })

        
        
     })

     test('redirection (spa scenario)', function(t){
        t.plan(4);
    
        // rd.newWindow = undefined; - should not be commented but smokestack testing cannot deal with 
        //                             redirection of current page (SPA) which runs the test                                
        var resolve;
        var p = new Promise(function(res, rej){  resolve = res});
        t.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData), undefined,' no Error detected');

        t.deepEquals(rd.requestToken, sentData, 'data received');
        t.equals(window.localStorage.requestToken_, sentData.oauth_token, 'oauth_token (request token) saved'); 

        p.then(function(o){
           if(o.window) t.ok(o.window, ' redirected' );
         });
        
        test('callback url not confirmed by Twitter (spa)', function(t){
            t.plan(1);
            sentData.oauth_callback_confirmed = false;  // simulate confirmation with false
            t.throws(rd.redirection.bind(rd, resolve, error, sentData),'throw error (url not confirmed)');
            
            sentData.oauth_callback_confirmed = "true"; // return initial value
     
        })
        
      })

    
    t.end();
   })
  

   test('redirect (NO Promise)', function(t){ // redirection happens but Promise is not avalable
       t.plan(5);
      
       rd.callback_func = function(o){
          if(o.window) t.ok(o.window, 'redirected'); // check new window reference
       }

       var resolve = ''; // no promise avalable
       t.ok(rd.callback_func, 'callback function (no promise avalable)'); 
       t.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData), undefined,' no Error detected');

       t.deepEquals(rd.requestToken, sentData, 'data received');
       t.equals(window.localStorage.requestToken_, sentData.oauth_token, 'oauth_token (request token) saved'); 

        
       test('callback url not confirmed by Twitter (spa)', function(t){
            t.plan(1);
            sentData.oauth_callback_confirmed = false;  // simulate confirmation with false
            t.throws(rd.redirection.bind(rd, resolve, error, sentData),'throw error (url not confirmed)');
            
            sentData.oauth_callback_confirmed = "true"; // return initial value
     
       })
     t.end();
   })
   
   test('NO redirection (Promise)', function(t){   // redirection doesnt happen, promise is avalable
       
      test('twitter request error', function(t){  // twiter response message is not 200 OK
        t.plan(2);

        var error = { 
           statusCode:401, 
           statusMessage: "One does not simply walk into Mordor"
        } 
        var resolve;
        var p = new Promise(function(res, rej){  resolve = res});
        t.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData), undefined, 'error handled');


        p.then(function(o){
           if(o.error) t.ok(o.error, 'error object delivered to user')
        });
      });
 
       // sent data avalable(token present on server)

     t.end();   
   })

 t.end();
})  
