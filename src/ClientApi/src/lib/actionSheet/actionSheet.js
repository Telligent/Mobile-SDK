/*
 * ActionSheet
 * Private API
 *
 * Higher level abstraction of using the Sheet. Designed specifically to render a list of links
 *
 * var actionSheet = new ActionSheet(options)
 *   sheet: Sheet instance
 *
 * actionSheet.show(options)
 *   options:
 *     links: array of elements to render
 */
define('actionSheet', function($, global, undef) {

    function addLink(list, link) {
        var listItem = $(document.createElement('li'));
        listItem.append(link);
        list.append(listItem);
    }

    function show(context, links) {
        // build a UL of links
        var list = $(document.createElement('ul'));
        list.addClass('action-sheet');

        for(var i = 0; i < links.length; i++) {
            addLink(list, links[i]);
        }
        // show the UL in a sheet
        context.sheet.show(list);
    }

    function hide(context) {
        context.sheet.hide();
    }

    var ActionSheet = function(context) {

        context = context || {};
        context.sheet = context.sheet;

        return {
            show: function(options) {
                options = options || {};
                options.links = options.links || [];
                show(context, options.links || []);
            },
            hide: function() {
                hide(context);
            }
        }
    };
    return ActionSheet;

}, jQuery, window);