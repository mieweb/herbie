$.extend($.expr[":"], {
    "starts-with": function(elem, i, data, set) {
        var text = $.trim($(elem).text()), term = data[3];

        // first index is 0
         return text.indexOf(term) === 0;
    },

    "ends-with": function(elem, i, data, set) {
        var text = $.trim($(elem).text()), term = data[3];

        // last index is last possible
        return text.lastIndexOf(term) === text.length - term.length;
    }
});

function jquery_to_textfield_vision(el, vision) {
}

function make_ordinal(num) {
    var end = 'th';
    switch (num % 10)
        case 1:
            end = (num % 100 < 14) ? 'th' : 'st';
            break;
        case 2:
            end = (num % 100 < 14) ? 'th' : 'nd';
            break;
        case 3:
            end = (num % 100 < 14) ? 'th' : 'rd';
            break;
        default:
            end = 'th';
            break;
    return num + end;
}

function vision() {
    return {
        'noun': '',
        'ordinal': '',
        'label': '',
        'element': null};
}

var translations = {
    // The order in which to get the translation object
    _order: [ ],
    addTranslationObject: function addTranslationObject(obj, after){
        // Add obj to the mapping (obj.noun => obj)
        //   obj: the object to add
        //   after [optional]: the noun name of the object to add obj
        //     after, if obj is not already added.  If obj has already
        //     been added, it is replaced without changing its order.
        //     If 'after' is not provided and obj has not already been
        //     added, it is added at the end
        // order array after the position of 'after', if 
        var i = -1;
        if(typeof(this[obj.noun]) === 'undefined') {
            if(after) {
                i = this._order.indexOf(after);
            }

            if(i > -1) {
                this._order.splice(i + 1, 0, obj.noun);
            } else {
                this._order.append(obj.noun);
            }
        }
        this[obj.noun] = obj;
        return obj;
    }
};

// Order of containers to look for, in order of least specific to most
// specific
// The MIE version of this will include a lot more
var container_order  = [
    ['box', 'table'],
    ['table header', 'table body', 'table footer'],
    ['row'],
    ['cell'],
    ['button', 'textfield', 'textarea', 'radio button', 'checkbox', 'dropdown', 'image', 'text',
        // These three are last because when we're dealing with them,
        // they are always alone in context
        'alert', 'window', 'frame']
];

// Finds out what Vision noun, if any, this element matches
var element_matcher
function jquery_to_vision(el, context, noun) {
    var v = vision();
    v.noun = noun;
    v.label = el.attr('value');
    v.element = el;

    // First, get Vision translations for all parents up to the context, in reverse order
    // This will only keep the elements for which there is an actual
    // translation, others will be filtered out
    var parents = $.map(
        $().add(el).parentsUntil(context.element),
        function(el) {
            // Gets all legitamite translations from this element
            var visionTranslations = jQuery.grep(
                $.map(translations._order, function(key){
                    return translations[key].makeVisionNoun(el);
                }),
                function(el, i){return el !== null;});

            // If there are any legitamite translations, get the first
            // one, otherwise, null
            // TODO: Find out if there's some sort of takeFirst sort of
            //   function, so that I don't have to iterate across all
            //   possibilities, just to get the first and throw the rest
            //   away
            return visionTranslations.length?visionTranslations[0]:null;
        }).filter(
            // Get rid of all the null elements, these are elements that
            // had no legitimate translation
            function(i, el){return this != null;}
        );

    





    var matches = (context?context.find(translations[noun].selector):$(translations[noun].selector).find(translations[noun].make_label(v.label);
    v.ordinal = matches.length > 1 ? make_ordinal(matches.index(el) + 1) : '';
    return v;
}

function make_translation(noun, translator, selector, make_label, noun_finder) {
    var translation_obj = {
        toVisionPhrase: function(el, context) { return translator(el, context, noun); },
        selector: selector,
        make_label: make_label,
        makeVisionNoun: noun_finder
    };
    translations[noun] = translation_obj;
    return translations_obj;
}

make_translation(
    'button',
    jquery_to_vision,
    'input[type="button"],input[type="submit"], button',
    function(v){return '[value="' + v.label + '"]';}
);

$(document).ready(function(){
    // Set up a port to communicate with the extension
    var port = chrome.runtime.connect({name: "watcher"});

    // Set up event to tell the extension we clicked on a button
    $(translations.button.selector).click(function(){
        var msg = 'Click the "' + $(this).attr('value') + '" button\n';
        port.postMessage({
            type: 'action',
            message: msg
        });
        console.log(msg);
    });

    // Set up event to tell the extenstion we changed a textfield
    $('input[type="text"], input[type="password"], input[type="email"]').change(function(){
        var labels = $(this)[0].labels;
        var label_text = labels ? labels[0].text() : 
        var msg = 'Type "' + + '" in the "' + $(this).attr('value') + '" button\n';
        port.postMessage({
            type: 'action',
            message: msg
        });
        console.log(msg);
    });
});

