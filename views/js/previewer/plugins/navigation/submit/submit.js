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
 * Copyright (c) 2018-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test Previewer Navigation Plugin : Submit
 *
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'i18n',
    'moment',
    'ui/hider',
    'ui/autoscroll',
    'util/strPad',
    'taoTests/runner/plugin',
    'taoQtiItem/qtiCommonRenderer/helpers/PciResponse',
    'tpl!taoQtiTest/runner/plugins/templates/button',
    'tpl!taoQtiTestPreviewer/previewer/plugins/navigation/submit/preview-console',
    'tpl!taoQtiTestPreviewer/previewer/plugins/navigation/submit/preview-console-line',
    'tpl!taoQtiTestPreviewer/previewer/plugins/navigation/submit/preview-console-closer'
], function (
    $,
    _,
    __,
    moment,
    hider,
    autoscroll,
    strPad,
    pluginFactory,
    pciResponse,
    buttonTpl,
    consoleTpl,
    consoleLineTpl,
    consoleCloserTpl
) {
    'use strict';

    /**
     * Some default config for the plugin
     * @type {Object}
     */
    const defaults = {
        submitTitle: __('Submit and show the result'),
        submitText: __('Submit'),
        submitIcon: 'forward'
    };

    return pluginFactory({

        name: 'submit',

        /**
         * Initialize the plugin (called during runner's init)
         */
        init() {
            const testRunner = this.getTestRunner();
            const pluginConfig = _.defaults(this.getConfig(), defaults);

            /**
             * Tells if the component is enabled
             * @returns {Boolean}
             */
            const isPluginAllowed = () => {
                const config = testRunner.getConfig();
                return !config.options.readOnly;
            };

            // display the console and its related controls, then auto scrolls to the last element
            const showConsole = () => {
                hider.show(this.controls.$console);
                hider.show(this.controls.$consoleBody);
                hider.show(this.controls.$consoleCloser);
                autoscroll(this.controls.$consoleBody.children().last(), this.controls.$consoleBody);
            };

            // hide the console and its related controls
            const hideConsole = () => {
                hider.hide(this.controls.$console);
                hider.hide(this.controls.$consoleCloser);
            };

            // add a line to the console
            const addConsoleLine = (type, message) => {
                const data = {
                    time: strPad(moment().format('HH:mm:ss'), 12, ' '),
                    type: strPad(type || '', 18, ' '),
                    message: strPad(message || '', 18, ' ')
                };
                this.controls.$consoleBody.append($(consoleLineTpl(data)));
            };

            // display responses in the console
            const showResponses = (type, responses) => {
                _.forEach(responses, (response, identifier) => {
                    addConsoleLine(type, strPad(`${identifier}: `, 15, ' ') + _.escape(pciResponse.prettyPrint(response)));
                });
            };

            this.controls = {
                $button: $(buttonTpl({
                    control: 'submit',
                    title: pluginConfig.submitTitle,
                    icon: pluginConfig.submitIcon,
                    text: pluginConfig.submitText
                })),
                $console: $(consoleTpl()),
                $consoleCloser: $(consoleCloserTpl())
            };
            this.controls.$consoleBody = this.controls.$console.find('.preview-console-body');

            this.controls.$button.on('click', e => {
                e.preventDefault();
                if (this.getState('enabled') !== false) {
                    this.disable();
                    testRunner.trigger('submititem');
                }
            });

            this.controls.$consoleCloser.on('click', e => {
                e.preventDefault();
                hideConsole();
            });

            if (!isPluginAllowed()) {
                this.hide();
            }

            this.disable();

            testRunner
                .on('render', () => {
                    if (isPluginAllowed()) {
                        this.show();
                    } else {
                        this.hide();
                    }
                })
                .on('submitresponse', responses => {
                    showResponses(__('Submitted data'), responses);
                    showConsole();
                })
                .on('scoreitem', responses => {
                    if (responses.itemSession) {
                        showResponses(__('Output data'), responses.itemSession);
                        showConsole();
                    }

                    if (responses.displayFeedback && responses.feedbacks) {
                        testRunner.itemRunner.renderFeedbacks(responses.feedbacks, responses.itemSession, function(
                            queue
                        ) {
                            testRunner.trigger('modalFeedbacks', queue);
                        });
                    }
                })
                .on('enablenav', () => {
                    this.enable();
                })
                .on('disablenav', () => {
                    this.disable();
                });
        },

        /**
         * Called during the runner's render phase
         */
        render() {
            //attach the element to the navigation area
            const $container = this.getAreaBroker().getContainer();
            const $navigation = this.getAreaBroker().getNavigationArea();
            $navigation.append(this.controls.$button);
            $navigation.append(this.controls.$consoleCloser);
            $container.append(this.controls.$console);
        },

        /**
         * Called during the runner's destroy phase
         */
        destroy() {
            _.forEach(this.controls, $el => $el.remove());
            this.controls = null;
        },

        /**
         * Enable the button
         */
        enable() {
            this.controls.$button
                .prop('disabled', false)
                .removeClass('disabled');
        },

        /**
         * Disable the button
         */
        disable() {
            this.controls.$button
                .prop('disabled', true)
                .addClass('disabled');
        },

        /**
         * Show the button
         */
        show() {
            hider.show(this.controls.$button);
        },

        /**
         * Hide the button
         */
        hide() {
            _.forEach(this.controls, hider.hide);
        }
    });
});
