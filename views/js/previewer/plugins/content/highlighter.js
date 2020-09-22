/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test Previewer Control Plugin : Close
 *
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'i18n',
    'ui/hider',
    'taoTests/runner/plugin',
    'tpl!taoQtiTest/runner/plugins/templates/button',
    'ui/highlighter'
], function ($, _, __, hider, pluginFactory, buttonTpl, highlighterFactory) {
    'use strict';

    return pluginFactory({
        name: 'highlighter',

        /**
         * Initialize the plugin (called during runner's init)
         */
        init: function init() {
            var self = this;
            var testRunner = this.getTestRunner();

            if (!window.getSelection) throw new Error('Browser does not support getSelection()');
            const selection = window.getSelection();

            var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
            var eventer = window[eventMethod];
            var messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

            var highlighter = highlighterFactory({
                className: 'txt-user-highlight',
                containerSelector: '.qti-itemBody',
                containersBlackList: [],
                clearOnClick: true
            });

            eventer(messageEvent, function (e) {
                if (e.data.event === 'setIndex') {
                    // Applying any highlighIndex received from parent
                    highlighter.highlightFromIndex(e.data.payload);
                }
            });

            this.$element = $(
                buttonTpl({
                    control: 'highlight',
                    title: __('Highlight'),
                    icon: 'edit',
                    text: __('Highlight'),
                    className: 'context-action'
                })
            );

            this.$clear = $(
                buttonTpl({
                    control: 'highlight',
                    title: __('Clear Highlights'),
                    icon: 'close',
                    text: __('Clear Highlights'),
                    className: 'context-action'
                })
            );

            this.$element.on('click', function (e) {
                e.preventDefault();
                if (self.getState('enabled') !== false) {
                    self.disable();
                    testRunner.trigger('finish');
                }
            });

            testRunner.after('renderitem', function () {
                console.log('after render item fired ');
                parent.postMessage({ event: 'rendered' }, '*');
            });

            const getAllRanges = () => {
                var i,
                    allRanges = [];

                for (i = 0; i < selection.rangeCount; i++) {
                    allRanges.push(selection.getRangeAt(i));
                }
                return allRanges;
            };

            this.$element.on('click', function (e) {
                e.preventDefault();

                //coming from highlighter.js lib
                highlighter.highlightRanges(getAllRanges());
                //Sending the highlighIndex to parent so that it can be saved on MS side
                parent.postMessage({ event: 'indexUpdated', payload: highlighter.getHighlightIndex() }, '*');
            });

            this.$clear.on('click', function (e) {
                e.preventDefault();

                //coming from highlighter.js lib
                highlighter.clearHighlights();
                //Sending the highlighIndex to parent so that it can be saved on MS side
                parent.postMessage({ event: 'indexUpdated', payload: highlighter.getHighlightIndex() }, '*');
            });
        },

        /**
         * Called during the runner's render phase
         */
        render: function render() {
            //attach the element to the navigation area
            var $container = this.getAreaBroker().getArea('context');
            $container.append(this.$element);
            $container.append(this.$clear);
        },

        /**
         * Called during the runner's destroy phase
         */
        destroy: function destroy() {
            this.$element.remove();
        }
    });
});
