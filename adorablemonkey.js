Seasons = new Meteor.Collection('seasons');
Standings = new Meteor.Collection('standings');
var defaultSeason = 351;

//------------- CLIENT -------------
if (Meteor.isClient) {  
  Session.setDefault("leagueCaption", "");

  Template.hudl.helpers({

    seasons: function() {
      return Seasons.find({});
    },

    leagueCaption: function() {
      return Session.get("leagueCaption");
    },

    standings: function() {
      return Standings.find({});
    }

  });

  Template.season.events({
    "click .showInfo": function () {      
      Session.set("leagueCaption", this.caption);
      Meteor.call('updateLeagueTable', this.id);
    }

  });
}

//------------- SERVER -------------
if (Meteor.isServer) {
  var AUTH_TOKEN = "0dc2b4843a2147f586b8b477af21d841";
  var baseUrl = "http://api.football-data.org/alpha/soccerseasons/";

  Meteor.startup(function() {

    Meteor.call('getSeasons', function(error, result) {
      if (!error) {
        var seasons = JSON.parse(result);
        seasons.forEach(function(season, i, v) {          
          //Json doesn't contain id, so extract from link
          var seasonId = season._links.self.href.split(baseUrl)[1];

          Seasons.upsert({ 
            id: seasonId
          }, {
            $set: {
              caption: season['caption'],
              league: season['league'],
              year: season['year'],
              numberOfTeams: season['numberOfTeams'],
              numberOfGames: season['numberOfGames'],
              lastUpdated: season['lastUpdated']
            }
          });
        });
      }
    });

  });

  Meteor.methods({

    getSeasons: function() {      
      return Meteor.call('getData', baseUrl);
    },

    updateLeagueTable: function(seasonId) {
      Standings.remove({});

      //NOTE: We could have fetched all standings on startup and store locally by season,
      //but let's simulate that the data changes often for funsies.
      Meteor.call('getLeagueTable', seasonId, function(error, result) {
        if (!error) {
          var leagueTable = JSON.parse(result);        
          var standings = leagueTable['standing'];

          standings.forEach(function(standing, i, v) {
            Standings.insert({
              position: standing['position'],
              teamName: standing['teamName'],
              playedGames: standing['playedGames'],
              points: standing['points'],
              goals: standing['goals'],
              goalsAgainst: standing['goalsAgainst'],
              goalDifference: standing['goalDifference'],
            });
          });
        }
      });
    },

    getLeagueTable: function (seasonId) {
      return Meteor.call('getData', baseUrl + seasonId + "/leagueTable");
    },

    getData: function(url)
    {
      try {
        var result = Meteor.http.get(url, {
          headers: {
            "X-Auth-Token": AUTH_TOKEN
          } 
        });

        if (result.statusCode == 200) {
          return result.content;
        }
      }
      catch (e) {
        console.log("Error: " + e);
      }
    }  

  });
}

//------------- ROUTES -------------
Router.map(function(){
    this.route('main', {path: '/'} );
    this.route('hudl', {path: '/hudl'});
});