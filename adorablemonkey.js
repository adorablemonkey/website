//------------- CLIENT -------------
if (Meteor.isClient) {
  
  //Init
  Session.setDefault('counter', 0);

  //Main
  Template.main.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.main.events({
    'click button': function () {
      Session.set('counter', Session.get('counter') + 1);
    }
  });
}

//------------- SERVER -------------
if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
