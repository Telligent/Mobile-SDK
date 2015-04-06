using System;
using System.Web;
using System.Web.Routing;
using Telligent.Evolution.Mobile.Web.Services;

namespace Telligent.Evolution.Mobile.Web
{
    // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
    // visit http://go.microsoft.com/?LinkId=9394801

	public class Global : System.Web.HttpApplication
	{
		void Application_Start(object sender, EventArgs e)
		{
			// Code that runs on application startup

			// This results in a significant performance improvement over SSL
			System.Net.ServicePointManager.ServerCertificateValidationCallback = (s, c, c2, e2) => true;

			Telligent.Evolution.Extensibility.UI.Version1.RemoteScriptedContentFragmentHost.Register(new Host());

			RouteTable.Routes.Ignore("{resource}.axd/{*pathInfo}");
			RouteTable.Routes.Add(new Route("", new StaticRouteHandler<Telligent.Evolution.Mobile.Web.RootPage>()));
			RouteTable.Routes.Add(new Route("rsw.ashx/{*pathInfo}", new StaticRouteHandler<Telligent.Evolution.Extensibility.UI.Version1.RemoteScriptedContentFragmentsHttpHandler>()));
			RouteTable.Routes.Add(new Route("oauth.ashx/{*pathInfo}", new StaticRouteHandler<Telligent.Evolution.Extensibility.OAuthClient.Version1.OAuthClientHttpHandler>()));
			RouteTable.Routes.Add(new Route("callback.ashx/{*pathInfo}", new StaticRouteHandler<Telligent.Evolution.Mobile.Web.Callback>()));
			RouteTable.Routes.Add(new Route("stylesheets", new StaticRouteHandler<Telligent.Evolution.Mobile.Web.StyleSheets>()));
			RouteTable.Routes.Add(new Route("javascripts", new StaticRouteHandler<Telligent.Evolution.Mobile.Web.JavaScripts>()));
			RouteTable.Routes.Add(new Route("embeddedfile/{*pathInfo}", new StaticRouteHandler<Telligent.Evolution.Mobile.Web.EmbeddedFileHandler>()));
			RouteTable.Routes.Add(new Route("services/formatagodate", new StaticRouteHandler<Telligent.Evolution.Mobile.Web.FormatAgoDate>()));

			ServiceLocator.Get<IPageRouteRegistrar>().RegisterRoutes();
		}

		void Application_End(object sender, EventArgs e)
		{
			//  Code that runs on application shutdown

		}

		void Application_Error(object sender, EventArgs e)
		{
			// Code that runs when an unhandled error occurs

		}

		void Session_Start(object sender, EventArgs e)
		{
			// Code that runs when a new session is started

		}

		void Session_End(object sender, EventArgs e)
		{
			// Code that runs when a session ends. 
			// Note: The Session_End event is raised only when the sessionstate mode
			// is set to InProc in the Web.config file. If session mode is set to StateServer 
			// or SQLServer, the event is not raised.
		}


		internal class StaticRouteHandler<T> : IRouteHandler where T : IHttpHandler, new()
		{
			public IHttpHandler GetHttpHandler(RequestContext requestContext)
			{
				return new T();
			}
		}
	}
}