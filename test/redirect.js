var test = require('tape');
var Redirect = require('../src/Redirect');


var args = {    
  newWindow:{
    name: 'nw',
    features:'resizable=yes,height=613,width=400,left=400,top=300'

  },
  redirectionUrl: 'https://api.twitter.com/oauth/authorize',  // authorization url;
  callback_func: function(deliverdData){ console.log(deliveredData)}
}

var rd = new Redirect(args); //

test('Redirection params', function(t){
    t.plan(3);

    t.deepEquals(rd.newWindow, args.newWindow, 'newWindow');
    t.equals(rd.url, args.redirectionUrl, 'redirectionUrl');
    t.deepEquals(rd.callback_func, rd.callback_func, 'callback function')
})


