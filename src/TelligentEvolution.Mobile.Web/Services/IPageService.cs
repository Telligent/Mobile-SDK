using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Mobile.Web.Model;

namespace Telligent.Evolution.Mobile.Web.Services
{
	internal interface IPageService
	{
		Page Get(Guid id);
		IEnumerable<Page> GetAll();
		event EventHandler Changed;
	}
}
