// App.js

$.ajaxPrefilter( function( options, originalOptions, jqXHR ) {
    options.url = 'http://127.0.0.1/api' + options.url;
    console.log("request to " + options.url);
});

// User Model
var User = Backbone.Model.extend({

    defaults: {
        id: 0,
        username: "",
        password: ""
    }

});

// Users Collection
var Users = Backbone.Collection.extend({

    url: '/users', // Rails server returns json
    model: User,
    initialize: function(){
        console.log("Users initialize");
    },
    parse : function(response, options){ // fetch call this function when receive data from server
        console.log("Users.Collection: parse() Data received");
        console.log(response);
        //this.remove();
        _.each(JSON.parse(JSON.stringify(response)), function (item) {
            console.log("id: " + item.id +" - username: " + item.name + " - password: " + item.password); // The variables name are from rails
            //this.add(new User({id: item.id, username: item.username, password: item.password}));
        });
        return response; // this return go to response param in fetch sucess callback
    }

});

// Main View (shows a menu)
var MenuView = Backbone.View.extend({

    template: _.template($("#tpl-menu").html()),
    initialize: function() {
        this.render();
    },
    render: function(){
        this.$el.html(this.template({}));
    }

});

// New User
var NewUserView = Backbone.View.extend({
    index: false,
    events: {
        'click button': 'save'
    },
    initialize: function() {
        this.model = new Users;
        this.render();
    },
    render: function(index) {
        var template, html = $("#tpl-form").html();
        if(typeof index == 'undefined') { // For create new user
            this.index = false;
            template = _.template(html, { username: "", password: ""});
        } else { // for editing a existing user
            this.index = parseInt(index);
            this.userForEditing = this.model.at(this.index);
            template = _.template($("#tpl-form").html(), {
                username: this.userForEditing.get("username"),
                password: this.userForEditing.get("password")
            });
        }
        this.$el.html(template);
        this.$el.find("#fname").focus();
        this.delegateEvents();
        return this;
    },
    save: function(e) {
        e.preventDefault();
        var username = this.$el.find("#fname").val();
        var password = this.$el.find("#fpassword").val();
        if(username == "") {
            alert("Empty username!");
            return;
        }
        if(password == "") {
            alert("Empty password!");
            return;
        }
        if(this.index !== false) {
            console.log("Editing user's info");
            this.userForEditing.set("username", username);
            this.userForEditing.set("password", password);
        } else {
            console.log("Creating new user");
            var user = new User({ 
                username: username,
                password: password
            });
            this.model.add(user);
            user.save(null, {   // Sends data to Rails App
                success: function (response) { 
                    console.log("Saved success");
                    console.log(response)
                },
                error: function () { 
                    console.log("Saved Error");
                }
            });
        }
        this.trigger("saved");
    }
});

// Users View (List all)
var UsersView = Backbone.View.extend({

    events: {},
    initialize: function() {
        console.log("UsersView init");
        this.model = new Users();
        this.model.fetch({
            success: function (response) {
                console.log("Success fetching");
                _.each(JSON.parse(JSON.stringify(response)), function (item) {
                    console.log("id: " + item.id +" - username: " + item.name + " - password: " + item.password); // The variables name are from rails
                });
            },
            error: function () { 
                console.log("Error fetching");
            }
        });
        this.render();
    },
    render: function() {
        console.log("UsersView render");
        var html = '<ul class="list">';
        console.log(this.model.length);
        this.model.each(function(user, index) {
            console.log(index + " -- " + user);
            var template = _.template($("#tpl-list-user").html());
            html += template({
                username: user.get("username"),
                index: index // user.get("id")
            });
        });
        html += '</ul>';
        this.$el.html(html);
        this.delegateEvents();
        return this;
    }

});

// Views
var ViewsFactory = {

    menu: function() {
        if(!this.menuView) {
            this.menuView = new MenuView({ 
                el: $("#menu")
            });
        }
        return this.menuView;
    },
    list: function() {
        if(!this.listView) {
            this.listView = new UsersView();
        }   
        return this.listView;
    },
    form: function() {
        if(!this.formView) {
            this.formView = new NewUserView().on("saved", function() {
                console.log("Button saved pressed");
                router.navigate("users", {trigger: true});
            })
        }
        return this.formView;
    }

}

// Routes
var Workspace = Backbone.Router.extend({

    routes: {
        "": "home", // Show a user login and the pong game ? 
        "users": "showUsers", // Show all Users
        "signup": "newUser", // Sign Up a user
        "edit/:index": "editUser", // Edit user's info
        "delete/:index": "deleteUser" // Delete a user
    },
    home: function() {
        var view = ViewsFactory.menu(); // Call list view
        App.title("Menu:").changeContent(view.$el);
        view.render();
    },
    showUsers: function() {
        var view = ViewsFactory.list(); // Call list view
        App.title("List of Users:").changeContent(view.$el);
        //view.render();
    },
    newUser: function() {
        var view = ViewsFactory.form();
        App.title("Create new User:").changeContent(view.$el);
        view.render();
    },
    editUser: function(index) {
        var view = ViewsFactory.form();
        App.title("Edit User:").changeContent(view.$el);
        view.render(index);
    },
    deleteUser: function(index) {
        App.users.remove(App.users.at(parseInt(index)));
        App.router.navigate("", {trigger: true});
    }

});

var App = {

    content: null,
    router: null,
    users: null,
    init: function() {
        this.content = $("#content");
        this.users = new Users;
        this.router = new Workspace;
        //ViewsFactory.menu();
        return this;
    },
    changeContent: function(el) {
        this.content.empty().append(el);
        return this;
    },
    title: function(str) {
        $("h1").text(str);
        return this;
    }
}

$(document).ready(function(){
    // Add some code here
    //App = new App();
    App.init();
    Backbone.history.start();
});
