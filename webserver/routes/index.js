/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index.html',
    {
        locals: {
            camera_ip: '192.168.1.2'
        }
    }
  );
};
