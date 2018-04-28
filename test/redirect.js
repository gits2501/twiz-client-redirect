var Redirect = require('../src/Redirect_instrumented.js');
var assert   = require('assert');

var cb =  function(deliveredData, descibe){ console.log(deliveredData); test() }; // callback function
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

describe('>>>  Redirect <<<', function(t){
   describe('Redirection params', function(t){
      
      it('newWindow',function(){
         assert.deepStrictEqual(rd.newWindow, args.newWindow);
      })
      it('redirectionUrl', function(){
         assert.equal(rd.url, args.redirectionUrl);
      })
      it('callback function', function(){
        assert.deepStrictEqual(rd.callback_func, rd.callback_func);
      })
   })   

  /// mock needed params
  var error;                                         // no error
  var sentData = {
     oauth_token: 'longStringOfAlphaNumerics109',    // redirection has to happen (token is present)
     oauth_callback_confirmed: "true"                // redirection url (callback url) confirmed 
  }


  describe('Redirect (Promise)', function(t){
     
     var resolve;                 
     var p =  new Promise(function(res, rej){ 
           resolve = res;                         // remember resolve
     })
    
     describe('Site', function(t){              // site scenarion (opens new window / popup)
       
        it('no Error detected', function(){
           assert.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData), undefined);
        })

        it('data received', function(){
           assert.deepStrictEqual(rd.requestToken, sentData);
        })
        
        it('oauth_token (request token) saved', function(){
          assert.equal(window.localStorage.requestToken_, sentData.oauth_token); 
        })
        
        it('redirected ->', function(done){
           p.then(function(o){
                if(o.window) 
                   assert.ok(typeof o.window === 'object', ' redirected' );
                   done();
           });
         })

        describe('callback url not confirmed by Twitter', function(t){
            
            it('throw error [url not confirmed]', function(){
               sentData.oauth_callback_confirmed = false;  // simulate confirmation with false
              assert.throws(rd.redirection.bind(rd, resolve, error, sentData));
               sentData.oauth_callback_confirmed = "true"; // return initial value
            })
     
        })

        
        
     })

     describe('SPA', function(t){ // single page app redirect current window (-no- new window / popup)
        //  rd.newWindow = undefined; //- should not be commented but testing cannot deal with 
                                    //  redirection of current page (SPA) which runs the test                  
        var resolve;
        var p = new Promise(function(res, rej){  resolve = res});
  
        it('no Error detected', function(){
           assert.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData), undefined);
        })

        it('data received', function(){
           assert.deepStrictEqual(rd.requestToken, sentData, 'data received');
        })
        
        it('oauth_token (request token) saved', function(){
           assert.equal(window.localStorage.requestToken_, sentData.oauth_token); 
        })

        it('redirected ->',function(done){
           p.then(function(o){
             if(o.window){ 
                 assert.ok(o.window);
                 done();
              }
           })
         });
        
        describe('callback url not confirmed by Twitter (spa)', function(t){
            
            sentData.oauth_callback_confirmed = false;  // simulate false confirmation
            it('throw error (url not confirmed)', function(){
               assert.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData));
            })
            
            sentData.oauth_callback_confirmed = "true"; // return initial value
     
        })
        
      })

    
   })
  

   describe('Redirect (Callback)', function(t){ // redirection happens but Promise is not avalable (callback used)
      
     describe('Site', function(){
       var resolve = ''; // no promise avalable

       it('redirected ->', function (done){
          rd.callback_func = function(o){
             if(o.window){  
                 assert.ok(o.window); // check new window reference
                 done(); 
              }

             rd.callback_func = function(){}; // set empty func so we dont call done multiple times (by other tests)
          }

          rd.redirection(resolve, error, sentData) // trigger invoking the callback_func
       })
       

       it(' no Error detected', function(){
         assert.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData), undefined);
       })     
  
       it('callback function (no promise avalable)', function(){
          assert.ok(rd.callback_func);
       })          
       
       it('data received', function(){
         assert.deepStrictEqual(rd.requestToken, sentData);
       })

       it('oauth_token (request token) saved', function(){
         assert.equal(window.localStorage.requestToken_, sentData.oauth_token); 
       })

        
       describe('callback url not confirmed by Twitter (spa)', function(t){
            
          
          it('throw error (url not confirmed)', function(){
             sentData.oauth_callback_confirmed = false;  // simulate confirmation with false
             
             assert.throws(rd.redirection.bind(rd, resolve, error, sentData));
             
             sentData.oauth_callback_confirmed = "true"; // return initial value
          })
          
     
       })
     })

     
   })
   
   describe('NO redirection (Promise)', function(t){  // redirection doesnt happen, promise is avalable
       
      describe('twitter request error', function(t){  // twiter response message is not 200 OK

         var error = {                                // simulate error received from twitter
           statusCode:401, 
           statusMessage: "One does not simply walk into Mordor"
         } 
         var resolve;
         var p = new Promise(function(res, rej){  resolve = res});
        
         it('error handled', function(){
            assert.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData), undefined);
         })


         it('error object delivered to user', function(done){ 
           p.then(function(o){
             if(o.error){
                  assert.ok(o.error);
                  done();
             }  
             
           }) 
         });
      });
 
      
     describe('received twiiter api data', function(){ // sent data avalable (access token was present on server)
       var p; 
        it('data received', function(){
           var resolve;
           p = new Promise(function(res, rej){ resolve = res})
           var error = ''
           sentData = { data: 'Ash nazg ghimbatul'}              // sumulate data received from twitter 
        
           assert.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData))    
        })
        
        it('data delivered to user', function(done){
           p.then(function(o){
              assert.ok(o.data)
              done();
           })
        }) 
    
     })

   })

   describe('NO redirection (Callback)', function(t){  // redirection doesnt happen, no promise (callabck used)
      var error = {                                      // simulate error received from twitter
              statusCode:401, 
              statusMessage: "One does not simply walk into Mordor"
      } 
      var sentData = { data: 'Ash nazg ghimbatul'}         
      var resolve = '' ; 

      describe('twitter request error', function(t){  // twiter response message is not 200 OK

         it('error handled', function(){
            assert.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData));
         })


         it('error object delivered to user', function(done){ 
           rd.callback_func = function(o){            // set callback
             if(o.error){
                  assert.ok(o.error);
                  done();
             }  
             rd.callback_func = function(){};
           }
           rd.redirection(resolve, error, sentData);  // trigger callback invocation
         });
      });
 
      
     describe('received twiiter api data', function(){ // sent data avalable (access token was present on server)
      
       it('data received', function(){
           assert.doesNotThrow(rd.redirection.bind(rd, resolve, error, sentData))    
       })
        
       it('data delivered to user', function(done){
           rd.callback_func = function(o){
              assert.ok(o.data)
              done();
           }
           rd.redirection(resolve, error, sentData);
        }) 
    
     })

   })

})  
