module.exports = function(app){
    app.get('/', index)
    app.get('/video/:id', video)
    app.get('/getTags', getTags)   
    app.get('/video/edit/:id', editVideo)   
    app.post('/video/edit/:id', saveVideo)   
    app.get('/test/', function(req,res) { res.render('autosuggest'); })
    
    var collections = ["videos", "tags"]
    var mongo = require('mongojs');

    var db = mongo("hack", collections)

    var videoServerUrl = "http://epruryaw0333/data/"

    function withListModel(tags, action)
    {
      var query = { videoProcessed: true, videoError: false }

      if (tags != null && tags.length > 0)
      {
        query.tags = { $all: tags }
      }

      db.videos.find(query, function(err, videos){
        db.tags.find(function(err, tags) {
          action(videos, tags)
        })
      })
    }

    function addVideoInfo(video)
    {
      if (!video.name) {
        var name = video.videoName
        if (name.lastIndexOf('\\') >= 0) {
          name = name.substr(name.lastIndexOf('\\') + 1)
        }

        if (name.indexOf('.') >= 0) {
          name = name.substr(0, name.indexOf('.'))          
        }
        video.name = name
      }
      video.name = video.name || video.videoName
      video.link = "/video/" + video._id
      video.imageUrl = videoServerUrl + "images/" + video.imageName,
      video.json = JSON.stringify(video)
      video.tags = video.tags || []
      video.editUrl = "/video/edit/" + video._id
      video.url = videoServerUrl + "videos/" + video.videoName
    }

    function index(req, res){
        var selectedTags = null
        if (req.query.tags) {
          selectedTags = req.query.tags.split(',')
        }

        withListModel(selectedTags, function(videos, tags){
          videos.forEach(addVideoInfo)
          tags.forEach(function(tag) {
            tag.url = '/?tags=' + tag.name;
          })

          var menuTags = tags.filter(function(tag) { return tag.showInMenu; })
          
          menuTags.unshift({ 
            name: 'Home',
            isMenuItem: true,
            url: '/'
          })

          res.render('index', { title: 'Learning Learning Learning', model: { videos: videos, tags: tags, menuTags: menuTags, selectedTags: selectedTags || [] }}) 
      })
    }

    function withVideo(req, action) 
    {
      db.videos.find({_id: mongo.ObjectId(req.params.id)}, function(err, items){
         var video = items[0]
         action(video)
      })
    }

    function video(req, res){
      withVideo(req, function(video) {
         addVideoInfo(video)       
         res.render('video', { title: 'Express', model: video })        
      })
    }        

    function editVideo(req, res) {      
      withVideo(req, function(video) {
         addVideoInfo(video)        
         res.render('editVideo', { title: 'Express', model: video })        
      })
    }    

    function saveVideo(req, res) {      
      withVideo(req, function(video) {
        video._id = mongo.ObjectId(req.params.id)
        video.name = req.body.name

        console.log(req.body.tags)
        var tags = req.body.tags.split(',').map(function(s) { return s.trim(); }).filter(function(t) { return t != ''; })
        console.log(tags)
        video.tags = tags

        video.description = req.body.description
        db.videos.save(video, function(err) {
          res.redirect("/video/" + req.params.id)
        })
      })
    }

    function getTags(req, res) {
      db.tags.find(function(err, tags) {
        res.json(tags)       
      })
  }
} 