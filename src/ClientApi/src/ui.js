/// @name ui
/// @category JavaScript API Module
/// @description UI Component framework methods
///
/// ### jQuery.telligent.evolution.ui
///
/// Implements the UI component framework, and exposes a few helper methods for calling it explicitly.
///
/// ### About the UI Component Framework:
///
/// **What are UI components?**
///
/// UI components are simple JavaScript objects defined on the namespace `jQuery.telligent.evolution.ui.components`. They are automatically invoked against any DOM elements matching a CSS class name of `ui-COMPONENTNAME`, where *componentname* matches a known UI component.
///
/// For example, given an HTML snippet:
///
///     <span class="ui-car" data-make="honda" data-model="civic"></span>
///
/// And a pre-defined UI component named `car`...
///
///     jQuery.telligent.evolution.ui.components.car = {
///         setup: function() {
///             // setup is called once per page if at least one element matches this component
///         },
///         add: function(elm, options) {
///             // add is called for each unique instance of an element matching the component
///             // elm is the matching element
///             // options is an object containing all data attributes defined on the element
///             $(elm).html('Car: ' + options.make + ' ' + options.model);
///         }
///     };
///
/// Then all instances of the span will be transformed on the client side to contain 'Car: [make] [model]'.
///
/// **What purpose do they serve?**
///
/// UI components allow the server-side to render a non-UI-specific instruction for the client to implement rendering. This allows hard-coded Widget API extensions to emit UI instructions while still allowing a theme to define how that UI looks and behaves.
///
/// Default implementations of the components are provided in Core, but they are designed to be overriden by themes as necessary.
///
/// **Automatic Behaviors**
///
/// Additionally, UI components are invoked against all matching elements when the page is modified too, not only after the page first loads. This makes UI components an easy way to embed interactive behaviors in content without having to specifically bind to events or set up handlers.
///
/// ### Methods
///
/// These are not often needed, and are usually invoked internally. They can be invoked explicitly as necessary.
///
/// #### render
///
/// Invokes all currently-known UI components against the page or a given selection within the page.
///
/// *As rendering is typically performed automatically, this is rarely needed.*
///
///     // invoke currently-defined UI components against all matching elements in div.mydiv
///     jQuery.telligent.evolution.ui.render('div.mydiv');
///
/// #### data
///
/// Given an element, parses its `data` attributes into an object. If an attribute exists named `data-configuration`, it parses its assumed querystring-encoded values as a separate object, `options.configuration`.
///
/// *As options are normally parsed by the UI component framework automatically, this is rarely needed.*
///
///     var data = jQuery.telligent.evolution.ui.data(elm);

(function($){
    var dataKey = '_telligent_evolution_ui_data',
        addRunKey = '_telligent_evolution_ui_render_add',
        setupRuns = {};
        parseData = function(elm) {
            elm = elm.get(0);
            var data = {};
            $.each(elm.attributes, function(i, attr) {
                if(attr.name.indexOf('data-') === 0) {
                    var name = attr.name.substring(5);
                    if(name === 'configuration') {
                        data[name] = $.telligent.evolution.url.parseQuery(attr.value);
                    } else {
                        data[name] = attr.value;
                    }
                }
            });
            return data;
        },
        api = {
            components: {},
            render: function(selector) {
                var container = $(selector || document);
                $.each(api.components, function(name, component) {
                    var componentInstances = $('.ui-' + name, container);
                    if(container.hasClass('.ui-' + name)) {
                        componentInstances.add(container);
                    }
                    // if there were any instances at all, run the component's setup
                    if(componentInstances && componentInstances.length > 0 && (typeof component.setup !== 'undefined') && !setupRuns[name]) {
                        component.setup.call(this);
                        setupRuns[name] = true;
                    }
                    // if there was an add, run the component's 'add' for each instnace, never more than once for an item, passing in parsed data attributes
                    if(componentInstances && componentInstances.length > 0 && (typeof component.add !== 'undefined')) {
                        componentInstances.each(function(){
                            var componentInstance = $(this);
                            if(!componentInstance.data(addRunKey)) {
                                component.add.call(componentInstance, componentInstance, api.data(componentInstance));
                                componentInstance.data(addRunKey, true);
                            }
                        });
                    }
                });
            },
            data: function(elm) {
                if(!elm) {
                    return {};
                }
                elm = $(elm);
                var data = elm.data(dataKey);
                if(data === null || typeof data === 'undefined') {
                    data = parseData(elm);
                    elm.data(dataKey, data);
                }
                return data;
            }
        };
    if(!$.telligent) { $.telligent = {}; }
    if(!$.telligent.evolution) { $.telligent.evolution = {}; }
    $.telligent.evolution.ui = api;

}(jQuery));

// wrap jQuery manipulation methods with automatic calls to $telligent.evolution.ui.render()
(function($){
   var wrap = function(fn, options) {
       return function() {
           try {
               if(options.before) {
                   options.before.apply(this, arguments);
               }
           } catch(e) {}
           var response = fn.apply(this, arguments);
           try {
               if(options.after) {
                   options.after.apply(this, arguments);
               }
           } catch(e) {}
           return response;
       }
   };

   $.each(['html','append','prepend'], function(i, fn) {
       $.fn[fn] = wrap($.fn[fn], {
           after: function() {
               $.telligent.evolution.ui.render(this);
           }
       });
   });
   $.each(['appendTo','prependTo'], function(i, fn) {
       $.fn[fn] = wrap($.fn[fn], {
           after: function(val) {
               $.telligent.evolution.ui.render($(val));
           }
       });
   });
   $.each(['after','before'], function(i, fn) {
       $.fn[fn] = wrap($.fn[fn], {
           after: function() {
               $.telligent.evolution.ui.render(this.parent());
           }
       });
   });
   $.each(['insertAfter','insertBefore'], function(i, fn) {
       $.fn[fn] = wrap($.fn[fn], {
           after: function(val) {
               $.telligent.evolution.ui.render($(val).parent());
           }
       });
   });
}(jQuery));

jQuery(function($){
    $.telligent.evolution.ui.render();
});