var Redirect = require('../src/Redirect_instrumented.js');
var assert   = require('assert');

function errorValidation(name, err){   // used to check thrown errors by name

    if(err.name === name) return true;
}

var cb =  function(deliveredData, descibe){  test() }; // callback function
var nW = {
    name: 'nw',
    features:'resizable=yes,height=613,width=400,left=400,top=300'
}

var args = {    
     newWindow: nW,
     redirectionUrl: './redirectionPage.html',  // authorization url
     callback_func: ''
   }

var response; 

beforeEach(function(){
   
   response = {
       error:'',                                          // no error
       data: {
          oauth_token: 'longStringOfAlphaNumerics109',    // redirection has to happen (token is present)
          oauth_callback_confirmed: "true"                // and redirection url (callback url) is confirmed 
       },
       xhr: { onReadyStateChange: function(){}}          
   }
})


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
  
   describe('Redirect (Promise)', function(t){
     
     var resolve;
     var reject;
     var p =  new Promise(function(res, rej){ 
           resolve = res;                         // remember resolve
           reject  = rej
     })
    
     describe('Site', function(t){                // site scenarion (opens new window / popup)
       
        it('no Error detected', function(){       // check that no error has been raised
             assert.doesNotThrow(rd.redirection.bind(rd, resolve, response), undefined);
        })
 
        it('data received', function(){         // data that twiter sent has been received 
           assert.deepStrictEqual(rd.requestToken, response.data);
        })
        
        it('oauth_token (request token) saved', function(){  // token has been saved
          assert.equal(window.localStorage.requestToken_, response.data.oauth_token); 
        })
        
        it('redirected ->', function(done){                  // redirection happens
          
           p.then(function(o){
                if(o.window){ 
                   assert.ok(!o.data, 'must not have any data when redirecting')
                   assert.ok(!o.error,'must not have any error when redirecting')

                   assert.ok(typeof o.window === 'object', ' redirected' );
                   done();
                }
           });
         })
     
        describe('callback url not confirmed by Twitter', function(t){
            var p = new Promise(function(res, rej){
                 rd.reject = rej                        // make promise reject reference avalable in rd instance
            });
             
            it('throw error [url not confirmed]', function(done){
            
               response.data.oauth_callback_confirmed = false;    // simulate confirmation with false
               rd.redirection(resolve, response)                  // initiate redirection
               p.then(null
                  ,
                  function onRejected(err){ 
                     assert.ok(errorValidation.bind('callbackURLnotConfirmed', err));
                     response.data.oauth_callback_confirmed = "true"; // return initial value
                     done();
               })
            })
     
        }) 
        
     })
 

  

   describe('SPA', function(t){ // single page app redirect current window (-no- new window / popup)
        //  rd.newWindow = undefined; //- should not be commented but testing cannot deal with 
                                      //  redirection of current page (SPA) which runs the test                  
        var resolve;
        var p = new Promise(function(res, rej){  resolve = res});
  
        it('no Error detected', function(){
           assert.doesNotThrow(rd.redirection.bind(rd, resolve, response), undefined);
        })

        it('data received', function(){
           assert.deepStrictEqual(rd.requestToken, response.data, 'data received');
        })
        
        it('oauth_token (request token) saved', function(){
           assert.equal(window.localStorage.requestToken_, response.data.oauth_token); 
        })

        it('redirected ->',function(done){
           p.then(function(o){
              if(o.window){ 
                 assert.ok(!o.data, 'must not have any data when redirecting')
                 assert.ok(!o.error,'must not have any error when redirecting')
                 
                 assert.ok(o.window);
                 done();
              }
           })
         });
        
        describe('callback url not confirmed by Twitter (spa)', function(t){
            
            it('throw error (url not confirmed)', function(done){
               var p = new Promise(function(res, rej){ 
                    rd.reject = rej // make promise reject reference
               }) 
               
               response.data.oauth_callback_confirmed = false;    // simulate confirmation with false
               
               rd.redirection(resolve, response)
               p.then(null,
                 function rejected(err){ 
                   assert.equal(err.name, 'callbackURLnotConfirmed');
                   rd.reject = ''; // unset
                   done();

               })
             
          
            })
            
        })
        
      })

    
   })
  

   describe('Redirect (Callback)', function(t){ // redirection happens but Promise is not avalable (callback used)
      
     describe('Site', function(){
       var resolve = ''; // no promise avalable

       it('redirected ->', function (done){
          rd.callback_func = function(o){
             if(o.window){ 
                 assert.ok(!o.data, 'must not have any data when redirecting')
                 assert.ok(!o.error,'must not have any error when redirecting')

                 assert.ok(o.window); // check new window reference
                 done(); 
              }

             rd.callback_func = function(){}; // set empty func so we dont call done multiple times (by other tests)
          }

          rd.redirection(resolve, response) // trigger invoking the callback_func
       })
       

       it(' no Error detected', function(){
         assert.doesNotThrow(rd.redirection.bind(rd, resolve, response));
       })     
  
       it('callback function (no promise avalable)', function(){
          assert.ok(rd.callback_func);
       })          
       
       it('data received', function(){
         assert.deepStrictEqual(rd.requestToken, response.data);
       })

       it('oauth_token (request token) saved', function(){
         assert.equal(window.localStorage.requestToken_, response.data.oauth_token); 
       })

        
       describe('callback url not confirmed by Twitter (spa)', function(t){
            
          
          it('throw error (url not confirmed)', function(){
             var savedPromise = Promise;
             Promise = '';                               // simulate no promise avalable
             response.data.oauth_callback_confirmed = false;  // simulate confirmation with false
             
             assert.throws(rd.redirection.bind(rd, resolve, response), errorValidation.bind(null, 'callbackURLnotConfirmed'));
             
             response.data.oauth_callback_confirmed = "true"; // return initial value
             Promise = savedPromise;                     // return Promise reference; 
          })
          
     
       })
     })

     
   })
   
   describe('NO redirection (Promise)', function(t){  // redirection doesnt happen, promise is avalable
       
      describe('twitter request error', function(t){  // twiter response message is not 200 OK

         var response = {
            error: {                                // simulate error received from twitter
              statusCode:401, 
              statusMessage: "One does not simply walk into Mordor"
            } 
         }

         var resolve;
         var p = new Promise(function(res, rej){  resolve = res});
        
         it('error handled', function(){      
            rd.callback_func = ''        
            assert.doesNotThrow(rd.redirection.bind(rd, resolve, response));
         })

         it('error object delivered to user', function(done){ // informative error object delivered to user
           p.then(function(o){ 
             if(o.error){
                  assert.ok(!o.data, 'must not have any data when error happens');
                  assert.ok(!o.window,'must not have window reference when error happens');
                  assert.ok(!o.redirection, 'must not have redirection indication when error happens');

                  assert.deepStrictEqual(o.error, response.error);
                  done();
             }  
             
           }) 
         });
      });
 
      
     describe('received twiiter api data', function(){ // sent data avalable (access token was present on server)
       var p;
       var response = {
              error: '',
              data:{ 'blackSpeech': 'Ash nazg ghimbatul'}     // sumulate data received from twitter 
        } 
        it('data received', function(){                // data from twitter is received
           var resolve;
           p = new Promise(function(res, rej){ resolve = res})

          

           assert.doesNotThrow(rd.redirection.bind(rd, resolve, response))    
        })
        
        it('data delivered to user', function(done){   // data from twitter delivered to user
           p.then(function(o){
              assert.equal(o.data, response.data)
              done();
           })
        }) 
    
     })

   })

   describe('NO redirection (Callback)', function(t){  // redirection doesnt happen, no promise (callabck used)
      var response = {
         error: {                                    // simulate error received from twitter
              statusCode:401, 
              statusMessage: "One does not simply walk into Mordor"
         }, 
         data: ''
      }         
      var resolve = '' ; 

      describe('twitter request error', function(t){  // twiter response message is not 200 OK

         it('error object delivered to user', function(done){  
           rd.callback_func = function(o){            // set callback
             if(o.error){ 
                  assert.ok(!o.data, 'must not have any data when error happens');
                  assert.ok(!o.window,'must not have window reference when error happens');
                  assert.ok(!o.redirection, 'must not have redirection indication when error happens');

                  assert.deepStrictEqual(o.error, response.error);
                  done();
             }  
             rd.callback_func = function(){};
           }
           rd.redirection(resolve, response);  // trigger callback invocation
         });
      });
 
      
     describe('received twiiter api data', function(){ // sent data avalable (access token was present on server)
      
       it('data received', function(){                  // data from twitter is received
           assert.doesNotThrow(rd.redirection.bind(rd, resolve, response))    
       })
        
       it('data delivered to user', function(done){    // data from twitter delivered to user
           response.data = {quote: 'End is never the end ...'} // simulate data
           response.error = '';                                // no error
           rd.callback_func = function(o){
              assert.ok(!o.error, 'must not have any error when data is delivered');
              assert.ok(!o.window,'must not have window reference data is delivered');
              assert.ok(!o.redirection, 'must not have redirection indication when data is delivered');
              
              assert.deepStrictEqual(o.data, response.data)
              done();
           }
           rd.redirection(resolve, response);
        }) 
    
     })

   })

   describe('no Promise and no Callback avalable',function(){
       var savedPromise = Promise;
       var rd = new Redirect(args)
       rd.callback_func = '' // no callback
             
       it('throw error', function(){
            
          Promise  = '';        // no Promise 
          assert.throws(rd.redirection.bind(rd, '', response),  // simulate no promise resolver
                          errorValidation.bind(null, 'noCallbackFunc'));
          Promise = savedPromise                                        // return Promise functionality
       })


 
   })  

})  
