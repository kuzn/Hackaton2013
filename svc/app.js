var chokidar = require('chokidar');

var watcher = chokidar.watch('\\\\epruryaw0333\\Video\\src\\', {ignored: /^\./, persistent: true});


var collections = ["videos"]

function extractFileName(fileName)
{
    return fileName.substring(fileName.lastIndexOf('\\') + 1)
}

function extractDir(fileName)
{
	var path = require('path');
	var dirName = path.dirname(fileName);
	if (dirName.lastIndexOf('\\') !== dirName.length - 1)
	{
		return dirName + '\\';
	}
	return dirName;
}

function makeDirRecursively(dirNames, index, callback)
{
    var fs = require('fs');
	
	if (index == dirNames.length)
	{
		callback();
	}
	else
	{
		var rest = dirNames.slice(0, index);
		var dir = rest.join('\\');
		
		fs.mkdir(dir, function() {
			makeDirRecursively(dirNames, index + 1, callback);
		});
	}
}

function convertFile(file, baseDirectory, destDirectory, fileExt, onError, onSuccess, converter)
{
	var fileName = file.originalFileName;
	var destinationFile = extractFileName(fileName) + fileExt;
	
	var fileDirectory = extractDir(fileName);
	var relativePath = fileDirectory.substring(baseDirectory.length);
	
	var destFullPath = destDirectory + relativePath;
	var destFileFullPath = destFullPath + destinationFile;

	//console.log("    ", destFileFullPath);
	
    var fs = require('fs');
	
	makeDirRecursively(destFullPath.split('\\'), 0, function () {
		fs.exists(destFileFullPath, function( exists ) {        
			if (exists)
			{
				console.log('File', destinationFile, 'already exists');
				onSuccess(file, relativePath + destinationFile);
			}
			else
			{
				//console.log("File", file.originalFileName, "has been added");
				
				var child = converter(file, destFileFullPath, function (error, stdout, stderr) {
					var err = stderr.trim();
					if (err !== null && err !== "")
					{
						fs.exists(destFileFullPath, function (exists) {
							if (exists)
							{
								onSuccess(file, relativePath + destinationFile);
							}
							else
							{
								onError(file, err);
							}
						});
					}
					else
					{
						onSuccess(file, destinationFile);
					}
				});
			}
		});
	});	
}

function createPng(file, onError, onSuccess)
{
	convertFile(file, "\\\\epruryaw0333\\Video\\src\\", "\\\\epruryaw0333\\Video\\dst\\images\\", ".png", onError, onSuccess, function (file, destFileFullPath, onError) {
		//console.log("  Create png for ", file.originalFileName, destFileFullPath);
		var execFile = require('child_process').execFile;
		var child = execFile('..\\utils\\ffmpeg.exe', ["-i", file.originalFileName, "-ss", "00:00:10", "-f", "image2", "-vframes", "1", "-s", "250x180", "-y", "-v", "warning", destFileFullPath], onError);
	});
}

function createVideo(file, onError, onSuccess)
{
	convertFile(file, "\\\\epruryaw0333\\Video\\src\\", "\\\\epruryaw0333\\Video\\dst\\videos\\", ".webm", onError, onSuccess, function (file, destFileFullPath, onError) {
		//console.log("  Create webm for ", file.originalFileName, destFileFullPath);
		var execFile = require('child_process').execFile;
		var child = execFile('..\\utils\\ffmpeg.exe', ["-i", file.originalFileName, "-y", "-v", "warning", destFileFullPath], onError);
	});
}

function addNewVideo(fileName)
{
	var mongojs = require('mongojs');

	var db = mongojs("hack", collections);
	
	db.videos.find(
		{"originalFileName": fileName},
		function(err, items)
		{
			if(items.length == 0)
			{
				db.videos.insert(
					{
						"originalFileName": fileName, 
						"processed": false, 
						"processing": false, 
						"error": false, 
						"videoProcessed": false, 
						"videoProcessing": false, 
						"videoError": false
					}, 
					function() {
						console.log('File', fileName, 'has been added');
					});
			}
		}
	)
}

function processImages()
{
	var mongojs = require('mongojs');

	var db = mongojs("hack", collections);
	
	db.videos.find(
		{ $or: [ {"processed": false, "processing": false}, { "error": true } ] },
		function(err, items)
		{
			for(i = 0; i < items.length; i++)
			{
			    var item = items[i];
				db.videos.update(
                     { _id : item._id },
                     { $set : { processing : true } },
                     { multi: false }
                );
				
				createPng(item,
					function(item, err)
					{
						console.log("  Converting error :", item.originalFileName);
						db.videos.update(
							 { _id : item._id },
							 { $set : { "processing" : false, "error": true, "errorText": err } },
							 { multi: true }
						);
					},
					function(item, destFileName)
					{
						console.log("  Converted successfully:", item.originalFileName);
						db.videos.update(
							 { _id : item._id },
							 { $set : { "error": false, "processing" : false, "processed": true, "imageName": destFileName } },
							 { multi: true }
						);
					}
				);
				
				
				// db.videos.update({"originalFileName": fileName, "processed": false}, function() {
					// console.log('File', fileName, 'has been added');
				// });
			}
		}
	)
}

function processVideos()
{
	var mongojs = require('mongojs');

	var db = mongojs("hack", collections);
	
	db.videos.find(
		{ $or: [ {"videoProcessed": false, "videoProcessing": false}, { "videoError": true } ] },
		function(err, items)
		{
			for(i = 0; i < items.length; i++)
			{
			    var item = items[i];
				db.videos.update(
                     { _id : item._id },
                     { $set : { videoProcessing : true } },
                     { multi: false }
                );
				
				createVideo(item,
					function(item, err)
					{
						console.log("  Converting error:", item.originalFileName);
						db.videos.update(
							 { _id : item._id },
							 { $set : { "videoProcessing" : false, "videoError": true, "videoErrorText": err } },
							 { multi: true }
						);
					},
					function(item, destFileName)
					{
						console.log("  Converted successfully:", item.originalFileName);
						db.videos.update(
							 { _id : item._id },
							 { $set : { "videoError": false, "videoProcessing" : false, "videoProcessed": true, "videoName": destFileName } },
							 { multi: true }
						);
					}
				);
				
				// db.videos.update({"originalFileName": fileName, "processed": false}, function() {
					// console.log('File', fileName, 'has been added');
				// });
			}
		}
	)
}

watcher
	.on('add', addNewVideo)
	.on('change', function(path) {console.log('File', path, 'has been changed');})
	.on('unlink', function(path) {console.log('File', path, 'has been removed');})
	.on('error', function(error) {console.error('Error happened', error);})

setInterval(
	function(){
		console.log("Processing video start.");
		processVideos();
		processImages();
	}, 
	10000);

watcher.close();
