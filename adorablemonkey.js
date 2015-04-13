Config = new Meteor.Collection('config');
Seasons = new Meteor.Collection('seasons');
Standings = new Meteor.Collection('standings');

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

    useTestData: function() {
      return Config.findOne({id: "default"});
    },

    standings: function() {
      return Standings.find({}, {sort: {position: 1}});
    }
  });

  Template.hudl.events({
    "click .toggleTestData": function () {
      Session.set("leagueCaption", "");
      Meteor.call('toggleUseTestData');
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
  var teamBaseUrl = "http://api.football-data.org/alpha/teams/";

  Meteor.startup(function() {
    Config.upsert({ id: "default"}, { $set: { useTestData: true} });
    Meteor.call('updateSeasons');
  });

  Meteor.methods({

    updateSeasons: function() {
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
    },

    getSeasons: function() {
      Standings.remove({});
      if (Config.findOne({id: "default"}).useTestData == true) {  
        return Assets.getText("seasons.json");
      }
      else {
        return Meteor.call('getData', baseUrl);
      }
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
            //Json doesn't contain id, so extract from link
            var teamId = standing._links.team.href.split(teamBaseUrl)[1];

            Meteor.call('getTeamCrest', teamId, function (e, r) {
              if (!e) {
                var teamData = JSON.parse(r);
                Standings.insert({
                  position: standing['position'],
                  teamName: standing['teamName'],
                  playedGames: standing['playedGames'],
                  points: standing['points'],
                  goals: standing['goals'],
                  goalsAgainst: standing['goalsAgainst'],
                  goalDifference: standing['goalDifference'],
                  crestUrl: teamData['crestUrl']
                });
              }
            });
          });
        }
      });
    },

    getLeagueTable: function (seasonId) {
      if (Config.findOne({id: "default"}).useTestData == true) {
        return Assets.getText("leagueTable.json");
      }
      else {
        return Meteor.call('getData', baseUrl + seasonId + "/leagueTable");
      }
    },

    getTeamCrest: function(teamId) {
      if (Config.findOne({id: "default"}).useTestData == true) {
        return Assets.getText("team.json");
      }
      else {
        return Meteor.call('getData', teamBaseUrl + teamId);
      }
    },

    getData: function(url) {
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
    },

    toggleUseTestData: function() {
      Config.update({id: "default"}, {$set: {useTestData: !Config.findOne({id: "default"}).useTestData}});
      Seasons.remove({});
      Meteor.call('updateSeasons');
    }

  });
}

//------------- ROUTES -------------
Router.map(function(){
    this.route('main', {path: '/'} );
    this.route('hudl', {path: '/hudl'});
});