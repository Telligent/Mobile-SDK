using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Telligent.Evolution.Mobile.Web;
using Telligent.Evolution.Mobile.Web.Model;
using Telligent.Evolution.Mobile.Web.Services;
using System.Web.UI;
using System.Web;

namespace Telligent.Evolution.Mobile.Web.Implementations
{
	internal class MobileRedirectionService : IMobileRedirectionService
	{
		IMobileConfiguration Configuration;

		internal MobileRedirectionService(IMobileConfiguration configuration)
		{
			Configuration = configuration;
		}

		public bool TryGetRedirectUrl(Host host, string url, out string redirectUrl)
		{
			if (string.IsNullOrEmpty(url))
			{
				redirectUrl = null;
				return false;
			}

			string cacheKey = CacheKey(url);
			redirectUrl = (string) host.Cache.Get(cacheKey);
			if (redirectUrl == null)
			{
				var entitiesDictionary = GetEntitiesDictionary(host, url);
				EntityUrl selectedUrl = null;
				int selectedOrderNumber = -1;

				foreach (EntityUrl entityUrl in Configuration.EntityUrls)
				{
					var o = IsMatch(entityUrl, entitiesDictionary);
					if (o > -1 && o > selectedOrderNumber)
					{
						selectedUrl = entityUrl;
						selectedOrderNumber = o;
					}
				}

				if (selectedUrl != null)
					redirectUrl = FormatUrl(selectedUrl, entitiesDictionary);
				else
					redirectUrl = string.Empty;

				host.Cache.Put(cacheKey, redirectUrl, 30 * 60);				
			}

			if (string.IsNullOrEmpty(redirectUrl))
			{
				redirectUrl = null;
				return false;
			}
			else
				return true;
		}

		private string CacheKey(string url)
		{
			return string.Concat("MobileRedirect:", url.ToLowerInvariant());
		}

		private string FormatUrl(EntityUrl url, Dictionary<string, List<EntityData>> entitiesDictionary)
		{
			string outUrl = url.Url;
			EntityData data;

			foreach (var token in url.Tokens)
			{
				data = GetEntityData(entitiesDictionary, token.EntityType, token.Relationship);
				if (data != null)
					outUrl = outUrl.Replace(string.Concat("{", token.Name, "}"), data.Id);
			}

			return outUrl;
		}

		private int IsMatch(EntityUrl url, Dictionary<string, List<EntityData>> entitiesDictionary)
		{
			EntityData data;
			int maxOrderNumber = -1;

			foreach (var requirement in url.Requirements)
			{
				data = GetEntityData(entitiesDictionary, requirement.EntityType, requirement.Relationship);

				if (data == null)
					return -1;

				if (requirement.IdEquals != null && string.Compare(data.Id, requirement.IdEquals, StringComparison.OrdinalIgnoreCase) != 0)
					return -1;

				if (requirement.ContainerTypeIdEquals != null && requirement.ContainerTypeIdEquals != data.ContainerTypeId)
					return -1;

				if (requirement.ApplicationTypeIdEquals != null && requirement.ApplicationTypeIdEquals != data.ApplicationTypeId)
					return -1;

				else if (data.OrderNumber > maxOrderNumber)
					maxOrderNumber = data.OrderNumber;
			}

			foreach (var token in url.Tokens)
			{
				data = GetEntityData(entitiesDictionary, token.EntityType, token.Relationship);
				if (data == null)
					return -1;
				else if (data.OrderNumber > maxOrderNumber)
					maxOrderNumber = data.OrderNumber;
			}

			return maxOrderNumber + url.Requirements.Count() + url.Tokens.Count();
		}

		private EntityData GetEntityData(Dictionary<string, List<EntityData>> entitiesDictionary, string entityType, string relationship)
		{
			List<EntityData> entities;
			if (entitiesDictionary.TryGetValue(entityType, out entities))
			{
				foreach (var entity in entities)
				{
					if (entity.Relationship == relationship)
						return entity;
				}
			}

			return null;
		}

		private Dictionary<string, List<EntityData>> GetEntitiesDictionary(Host host, string url)
		{
			Dictionary<string, List<EntityData>> entitiesDictionary = new Dictionary<string, List<EntityData>>();

			try
			{

				int i = 0;
				List<EntityData> entities;
				foreach (var entity in (from entity in host.GetRestEndpointXml("remoting/url/entities.xml?Url=" + Uri.EscapeDataString(url)).Descendants("UrlEntity")
										select new
										{
											EntityType = entity.Element("TypeName") != null ? entity.Element("TypeName").Value : null,
											Id = entity.Element("Id") != null ? entity.Element("Id").Value : null,
											Relationship = entity.Element("Relationship") != null ? entity.Element("Relationship").Value : null,
											ContainerTypeId = entity.Element("ContainerTypeId") != null ? entity.Element("ContainerTypeId").Value : null,
											ApplicationTypeId = entity.Element("ApplicationTypeId") != null ? entity.Element("ApplicationTypeId").Value : null
										}))
				{
					if (string.IsNullOrEmpty(entity.EntityType))
						continue;

					if (!entitiesDictionary.TryGetValue(entity.EntityType, out entities))
					{
						entities = new List<EntityData>();
						entitiesDictionary[entity.EntityType] = entities;
					}

					Guid applicationTypeId;
					bool applicationTypeIsNull = false;
					Guid containerTypeId;
					bool containerTypeIsNull = false;

					if (!Guid.TryParse(entity.ContainerTypeId, out containerTypeId))
						containerTypeIsNull = true;

					if (!Guid.TryParse(entity.ApplicationTypeId, out applicationTypeId))
						applicationTypeIsNull = true;

					entities.Add(new EntityData
					{
						Id = entity.Id,
						OrderNumber = i,
						Relationship = string.IsNullOrEmpty(entity.Relationship) ? null : entity.Relationship,
						ApplicationTypeId = applicationTypeIsNull ? (Guid?)null : (Guid?)applicationTypeId,
						ContainerTypeId = containerTypeIsNull ? (Guid?)null : (Guid?)containerTypeId
					});
					i++;
				}
			}
			catch (Exception ex)
			{
				// this is likely due to a redirect, in any case, assume no valid entities
				throw new InvalidOperationException("Could not retrieve details about the host URL", ex);
			}

			return entitiesDictionary;
		}

		class EntityData
		{
			internal string Id;
			internal string Relationship;
			internal Guid? ContainerTypeId;
			internal Guid? ApplicationTypeId;
			internal int OrderNumber;
		}
	}
}
