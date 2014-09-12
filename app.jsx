/** @jsx React.DOM */

// This is an example of routing works.
//
// When the user reach an URL, the data flows like this:
//
// 1. AppDispatcher (Router): respond to the route change, retreive corresponding
//    registration
// 2. AppDispatcher: The registration to the route shows:
//    - RootView
//    - Props to pass into the rootview
// 3. AppRootView: load specified RootView and give the props directly to the RootView
// 4. RootView: mounted with the given props
// ------------------------------------

// AppDispatcher
//
// Replace the `MainApp`, is a wrapper of `Backbone.Router`. It register
// RootViews as apps, and dispatch to the RootViews with specific `props`.

var AppDispatcher = function(apps) {
	this.router = new Backbone.Router();
	this.registerApps(apps || []);
};

AppDispatcher.prototype = {
	getApp: function(appName) {
		return window[appName];
	},

	// register one app route to a RootView and props
	registerAppRoute: function(appName, route, props) {
		var app = this.getApp(appName);

		this.router.route(route, _.bind(function() {
			this.handleRouting(app, props, Array.prototype.slice.call(arguments, 0));
		}, this));
	},

	registerApps: function(apps) {
		_.each(apps, function(routes, appName) {
			_.each(routes, function(props, route) {
				this.registerAppRoute(appName, route, props);
			}, this);
		}, this);

		this.apps = _.extend(this.apps, apps);
	},

	// route responder, retreive the RootView and the props
	handleRouting: function(RootView, getProps, parameters) {
		var props = _.isFunction(getProps) ?
			getProps.apply(this, parameters) : getProps;

		this.currentApp = RootView;
		this.currentProps = props;

		this.render();
	},

	interceptAnchorClicks: function() {
		var that = this;

		$(document).on('click', 'a', function(e) {
			var href = $(e.target).attr('href');
			e.preventDefault();

			that.router.navigate(href, {trigger: true});
		});
	},

	start: function() {
		this.interceptAnchorClicks();
		Backbone.history.start();
	},

	render: function() {
		React.renderComponent(
			<AppRootView rootView={this.currentApp}
				rootViewProps={this.currentProps} />,
			document.body
		);
	}
};


// Models
// ------------------------------------

var User = Backbone.Model.extend();


// Views
// ------------------------------------

// Note this is not a root view
var UserPageView = React.createClass({
	getInitialState: function() {
		return {
			description: 'default description'
		};
	},

	handleInputChange: function() {
		this.setState({
			description: this.refs.input.getDOMNode().value
		});
	},

	render: function() {
		var id = this.props.model.get('id');

		if (!this.props.isEditing) {
			return (
				<div>
					<p>Viewing {id}</p>
					<p><a href={id + '/edit'}>Edit</a></p>
					<p><a href={'/tester2/edit'}>Edit tester2</a></p>
					<p><a href='/events/0'>An Event (switching RootView)</a></p>
				</div>
			);
		} else {
			return (
				<div>
					<p>Editing {id}</p>
					<div>
						The content in the input will be reset only when switching root views.
						<br />
						<input
							type='text'
							ref='input'
							value={this.state.description}
							onChange={this.handleInputChange} />
					</div>
					<p><a href={id}>Done</a></p>
				</div>
			);
		}
	}
});

var UserRootView = React.createClass({
	getInitialState: function() {
		return {
			user: new User({id: this.props.userId})
		};
	},

	componentWillReceiveProps: function(nextProps) {
		if (nextProps.userId !== this.state.user.get('id')) {
			console.log('user changed');

			this.state.user.set({
				id: nextProps.userId
			});

			this.forceUpdate();
		}
	},

	render: function() {
		return <UserPageView model={this.state.user} isEditing={this.props.isEditing} />;
	}
});

var EventPageView = React.createClass({
	render: function() {
		return (
			<p>
				Looking at a cool event create by <a href="/EventMaster">EventMaster (switching Root View)</a>
			</p>
		);
	}
});

var EventRootView = React.createClass({
	render: function() {
		return <EventPageView />;
	}
});

// A special root view
var AppRootView = React.createClass({
	render: function() {
		if (this.props.rootView) {
			return this.props.rootView(this.props.rootViewProps);
		} else {
			return <div />;
		}
	}
});

// ------------------------------------

// App registration
var apps = {
	UserRootView: {
		'': {
			userId: 'default'
		},

		':id': function(id) {
			return {userId: id};
		},

		':id/edit': function(id) {
			return {userId: id, isEditing: true};
		}
	},

	EventRootView: {
		'events/:id': {}
	}
};


var dispatcher = new AppDispatcher(apps);
dispatcher.start();
