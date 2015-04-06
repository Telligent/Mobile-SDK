using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Mobile.Web.Services;
using Telligent.Evolution.Mobile.Web.Implementations;

namespace Telligent.Evolution.Mobile.Web
{
	internal static class ServiceLocator
	{
		private static object _lockObject = new object();
		private static Dictionary<Type, object> _instances = null;

		internal static T Get<T>()
		{
			EnsureInitialized();
			return (T)_instances[typeof(T)];
		}

		internal static void EnsureInitialized()
		{
			if (_instances == null)
				lock (_lockObject)
					if (_instances == null)
					{
						var localInstances = new Dictionary<Type, object>();
						var pageService = new PageService();

						#region Service Bindings

						var mobileConfiguration = new MobileConfiguration();
						var mobileRedirectionService = new MobileRedirectionService(mobileConfiguration);

						localInstances[typeof(IMobileConfiguration)] = mobileConfiguration;
						localInstances[typeof(IPageRouteRegistrar)] = new PageRouteRegistrar(pageService, mobileConfiguration);
						localInstances[typeof(IPageService)] = pageService;
						localInstances[typeof(IConfiguredContentFragmentService)] = pageService;
						localInstances[typeof(IMobileRedirectionService)] = mobileRedirectionService;
						localInstances[typeof(IHtmlService)] = new HtmlService(mobileConfiguration);

						#endregion

						_instances = localInstances;
					}
		}
	}
}
