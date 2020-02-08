const User = require('../models/user.model');
var fs = require('fs');
let mongodb = require('mongodb');
var path = require('path');
const crypto = require('crypto');
const async = require('async');
const nodemailer = require('nodemailer');

exports.user_forgot = function(req, res, next) {
    //done must be used to go to next function
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                let token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            console.log(req.body.email);
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    let message = 'No account with that email address exists.';
                    req.flash('error', message);
                    return res.redirect('./forgot');
                }
                console.log('step 1')
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            let smtpTrans = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'mfmsouthchicago@gmail.com',
                    pass: 'S@lv@t1on1987'
                }
            });
            var mailOptions = {

                to: user.email,
                from: 'mfmsouthchicago@gmail.com',
                subject: 'Your Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'

            };

            smtpTrans.sendMail(mailOptions, function(err) {
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                res.redirect('./forgot');
            });
        }
    ], function(err, user) {
        console.log('this err' + ' ' + err);
        res.redirect(
            url.format({
                pathname: '/user/login',
                query: user
            })
        );
    });
};

exports.user_get_forgot = function(req, res) {
    let errorMessage = req.flash('error');
    let successMessage = req.flash('success');
    let message = errorMessage.length > 0 ? errorMessage : successMessage;

    res.render('forgot', {information: message});//, {User: req.user}
};

exports.user_get_reset = function(req, res) {
    User.findOne({ resetPasswordToken: req.params["token"], resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('../forgot');
        }
        req.flash('success', 'Token found!!, You can now reset your password by creating a new one.');

        let errorMessage = req.flash('error');
        let successMessage = req.flash('success');
        let message = errorMessage.length > 0 ? errorMessage : successMessage;
        console.log(message);

        res.render('reset-user', {information: message});//, {User: req.user}, function(err, html) {
        // if (err) {
        //     console.log(err);
        //     res.redirect('./not-found'); // File doesn't exist
        // }}
    });
};

exports.user_reset = function(req, res) {
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params["token"], resetPasswordExpires: { $gt: Date.now() } }, function(err, user, next) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('./forgot');
                }

                user.password = req.body.password;
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                console.log('password ' + user.password  + ' and the user is' + user)

                user.save(function(err) {
                    done(err, user);
                    if (err) {
                        res.redirect('./not-found');
                    }
                });
            });
        }, function(user, done) {
            var smtpTrans = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'mfmsouthchicago@gmail.com',
                    pass: 'S@lv@t1on1987'
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'mfmsouthchicago@gmail.com',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                ' - This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTrans.sendMail(mailOptions, function(err) {
                done(err);
                res.redirect(
                    url.format({
                        pathname: '/user/login',
                        query: user
                    })
                );
            });
        }
    ], function(err) {
        res.redirect('/');
    });
};


exports.user_create = async (req, res, next) => {

    let user = new User(
        {
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
        }
    );

    console.log(user);
    User.find({},function (err, users) {
        if (err) {
            console.log(err);
            return res.status(500).send();
        }
        if (users.length === 0) {
            user.roles[0] = {"role": "userAdminAnyDatabase", "db": "photoalbumdb"}
        }
        if(users.length > 0) {
            user.roles[0] = {"role": "userOnly", "db": "photoalbumdb"}
        }

        user.save(function (err) {
            if (err) {
                return next(err);
                // return res.status(500).send();
            }
        });
        console.log(user);
        res.send(user._id);
        // return res.status(200).send();
    });
};

exports.user_login = function (req, res) {
    let username = req.body.username;
    let password = req.body.password;

    User.findOne({username: username, password: password}, function (err, user) {
        if (err) {
            console.log(err);
            return res.status(500).redirect('../../Views/error-not-found');
        }
        if (!user) {
            return res.status(404).redirect('../../Views/not-found');
        }
        req.session.user = user;
        return res.status(200).send(req.session);
    });
};

exports.user_get_login = function (req, res) {
    User.find({}, function (err, users) {
        if (err) return next(err);
        res.render('login', {Users: users});//
    });
};

exports.user_logout = function (req, res, next) {
    req.session.destroy();
    return res.status(200).send(req.session);
};

exports.admin_dashboard = function (req, res, next) {
    if(!req.session.user){
        return res.status(401).redirect('../../Views/not-found');//user not found
    }

    let loggedUser = req.session.user;
    console.log(loggedUser);

    res.render(path.join(__dirname, '../admin/admin'), {Users: loggedUser})
};

exports.user_not_found = function (req, res, next) {
    res.sendFile(path.resolve('./Views', 'not-found.html'));
};

exports.user_all = function (req, res, next) {
    User.find({}, function (err, users) {
        if (err) return next(err);
        console.log(users);
        res.send(users);
    });
};

exports.user_by = function (req, res, next) {
    User.find({}, function (err, users) {
        if (err) return next(err);

        let foundUsers= [];
        if(req.params.user)
            foundUsers = users.filter((user) => user.username.startsWith(req.params.user));

        res.send(foundUsers);
    });
};

exports.user_details = function (req, res, next) {
    User.findById(req.params.id, function (err, user) {
        if (err) return next(err);
        res.send(user);
    })
};

exports.user_updateRoles = function (req, res, next) {
    User.findOne({"_id": req.params.id},(err, user)=>{
        console.log(user);
        console.log(req.body);
        let userRoleRemove = user.roles.filter(e => e.role === "userAdminAnyDatabase" || e.role === "superUsers" || e.role === "userOnly");

        userRoleRemove.forEach(userRole => user.roles.splice(user.roles.findIndex(e => e.role === userRole.role),1));

        user.roles.push(req.body);
        user.save((err)=> {
            if (err) {
                return next(err);
            }
        });
        res.send("Role added successfully!!!");
    });
};

exports.user_update = function (req, res, next) {
    User.updateMany({"_id": req.params.id}, {
        $set: {
            "user" : req.body.user,
            "password" : req.body.password,
            // "roles" : [
            //     req.body.roles
            // ]
        }
    },{multi: true}, function (err, user) {
        if (err) return next(err);
        res.send('User udpated.');
    });
};

exports.user_delete = function (req, res, next) {
    // User.findOneAndDelete (req.params.id, function (err) {
    User.deleteOne({_id: new mongodb.ObjectID(req.params.id)}, function(err, events){
        if (err) return next(err);
        res.send('Deleted successfully!');
    })
};