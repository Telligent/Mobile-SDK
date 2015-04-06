using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Mobile.Web.Services;
using System.Web.Routing;
using System.Web;
using Telligent.Evolution.Mobile.Web.Model;

namespace Telligent.Evolution.Mobile.Web.Implementations
{
	internal class PageRouteRegistrar : IPageRouteRegistrar, IRouteHandler
	{
		private readonly IMobileConfiguration _config;
		private readonly IPageService _pageService;
		private Guid _loginPageKey;

		internal PageRouteRegistrar(IPageService pageService, IMobileConfiguration mobileConfiguration)
		{
			_pageService = pageService;
			_pageService.Changed += new EventHandler(_pageService_Changed);
			_config = mobileConfiguration;
		}

		void _pageService_Changed(object sender, EventArgs e)
		{
			RegisterRoutes();
		}

		public void RegisterRoutes()
		{
			ClearPageRoutes();

			foreach (var page in _pageService.GetAll())
			{
				Guid key = page.Id;

				var defaults = new RouteValueDictionary(page.PathParameterDefaults);
				defaults.Add("_pageKey", key);

				var constraints = new RouteValueDictionary(page.PathParameterContraints);

				RouteTable.Routes.Add(new Route(page.Path, defaults, constraints, this));

				if (!_config.AllowAnonymous && page.Name == _config.LoginPage)
					_loginPageKey = key;
			}
		}

		private void ClearPageRoutes()
		{
			var pluginRoutes = new List<RouteBase>(RouteTable.Routes.Where(x =>
			{
				var route = x as Route;
				return (route != null && route.RouteHandler == this);
			}));

			foreach (var route in pluginRoutes)
			{
				RouteTable.Routes.Remove(route);
			}
		}
	
		#region IRouteHandler Members

		public System.Web.IHttpHandler GetHttpHandler(RequestContext requestContext)
		{
			Guid pageKey;
			Page page;
			var host = Host.Get(Host.DefaultId) as Host;

			if (!requestContext.RouteData.Values.ContainsKey("_pageKey"))
				return null;

			if (!Guid.TryParse(requestContext.RouteData.Values["_pageKey"].ToString(), out pageKey))
				return null;

			if (!_config.AllowAnonymous && !host.GetAccessingUserIsAuthenticated())
				page = _pageService.Get(_loginPageKey);
			else
				page = _pageService.Get(pageKey);

			if (page == null)
				return null;

			return new PageHttpHandler(page, requestContext);
		}

		#endregion
	}

	public class PageHttpHandler : IHttpHandler
	{
		Page _page;
		RequestContext _requestContext;
		private static readonly IConfiguredContentFragmentService _configuredContentFragmentService = Telligent.Evolution.Mobile.Web.ServiceLocator.Get<IConfiguredContentFragmentService>();

		internal PageHttpHandler(Page page, RequestContext requestContext)
		{
			_page = page;
			_requestContext = requestContext;
		}

		internal Page Page
		{
			get { return _page; }
		}

		#region IHttpHandler Members

		public bool IsReusable
		{
			get { return false; }
		}

		public void ProcessRequest(HttpContext context)
		{
			var host = Host.Get(Host.DefaultId) as Host;
			if (host == null)
				return;

			var uiPage = new System.Web.UI.Page();
			uiPage.GetType().GetField("_request", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).SetValue(uiPage, context.Request);
			uiPage.GetType().GetField("_response", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).SetValue(uiPage, context.Response);

			host.SetRequestContext(_requestContext);

			int index = 0;
			foreach (var ccf in _page.ContentFragments)
			{
				string hostId = _configuredContentFragmentService.GetHostIdentifier(ccf);
				host.SetConfiguration(hostId, ccf.Configuration);
				host.Render(hostId, ccf.InstanceId, uiPage);
				index++;
			}

			using (var outputStream = context.Response.OutputStream)
			{
				using (var streamWriter = new System.IO.StreamWriter(outputStream))
				{
					using (var htmlWriter = new System.Web.UI.Html32TextWriter(streamWriter))
					{
						uiPage.RenderControl(htmlWriter);
					}
				}
			}
		}

		#endregion
	}
}

