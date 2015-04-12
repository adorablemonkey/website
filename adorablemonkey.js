//------------- CLIENT -------------
if (Meteor.isClient) {  
  var seasons = null;
  var seasonsDep = new Deps.Dependency();

  Template.hudl.rendered = function() {
    Meteor.call('getSeasons', function(error, result) {
      if (!error) {
        seasons = JSON.parse(result);

        //Json doesn't contain id, so extract from link
        $.each(seasons, function(index, value) {
          var seasonId = value._links.self.href.split("http://api.football-data.org/alpha/soccerseasons/")[1];
          value["id"] = seasonId;
        });

        seasonsDep.changed();
      }
    });
  }

  Template.hudl.helpers({

    seasons: function() {
      seasonsDep.depend();
      return seasons;
    }
  });
}

//------------- SERVER -------------
if (Meteor.isServer) {
  var AUTH_TOKEN = "0dc2b4843a2147f586b8b477af21d841";

  Meteor.startup(function() {
    
  });

  Meteor.methods({
    
    getSeasons: function () {
      try
      {
        //TODO: Put in reusable function that passes url
        var result = Meteor.http.get("http://api.football-data.org/alpha/soccerseasons", {
           headers: {
              "X-Auth-Token": AUTH_TOKEN
           } 
        });

        if (result.statusCode == 200)
        {
          return result.content;
        }
      }
      catch (e)
      {
        console.log("Error: " + e);
      }
    },

    getLeagueTable: function (leagueId) {
      //console.log("GET LEAGUE: " + leagueId);

      return leagueId;
    }  

  });
}

//------------- ROUTES -------------
Router.map(function(){
    this.route('main', {path: '/'} );
    this.route('hudl', {path: '/hudl'});
    
    this.route('league', {
      path: '/hudl/league/:seasonId',
      data: function() {
        Meteor.call('getLeagueTable', this.params.seasonId);
      }
    });
});