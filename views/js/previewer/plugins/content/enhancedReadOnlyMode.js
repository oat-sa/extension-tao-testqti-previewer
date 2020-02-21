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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

/**
 * Test Previewer Content Plugin : EnhancedReadOnlyMode
 *
 * This plugin can be used as a hook to do modification in the item preview for read only mode
 *
 * @author Ansul Sharma <ansul@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'i18n',
    'taoTests/runner/plugin'
], function ($, _, __, pluginFactory) {
    'use strict';

    return pluginFactory({

        name: 'EnhancedReadOnlyMode',

        /**
         * Initialize the plugin (called during runner's init)
         */
        init() {
            const testRunner = this.getTestRunner();

            /**
             * Enables the plugin only in readOnly mode
             * @returns {Boolean}
             */
            const isPluginAllowed = () => {
                const config = testRunner.getConfig();
                return config.options.readOnly;
            };

            testRunner
                .after('renderitem', () => {
                    if (isPluginAllowed()) {
                        const $contentArea = testRunner.getAreaBroker().getContentArea();
                        const $extendedTextinteractionTextAreas = $contentArea.find('.qti-extendedTextInteraction textarea.text-container');
                        const $ckeEditorsContent = $contentArea.find('.qti-extendedTextInteraction div.cke_contents');

                        /**
                         * Updates the height of textarea element of all extended text interactions based on the height of the content
                         */
                        if($extendedTextinteractionTextAreas.length) {
                            $extendedTextinteractionTextAreas.map((i, $textArea) => {
                                $textArea.style.height = `${$textArea.scrollHeight + 20}px`;
                            });
                        }

                        /**
                         * Updates the height of all the ckeEditor container of wysiwyg extended text interaction based on the height of the iFrame
                         */
                        if($ckeEditorsContent.length) {
                            $ckeEditorsContent.map((i, ckeEditorContent) => {
                                const $ckeEditorContent = $(ckeEditorContent);
                                const $ckeEditorIFrame = $ckeEditorContent.find('iframe.cke_wysiwyg_frame');

                                /**
                                 * Only update the height when the iFrame has finished loading the styles because font-size may change the height
                                 */
                                $ckeEditorIFrame.load = setTimeout(() => {
                                        const ckeEditorBody = $ckeEditorIFrame[0].contentWindow.document.querySelector('body');
                                        $ckeEditorContent[0].style.height = `${ckeEditorBody.scrollHeight + 20}px`;
                                }, 0);
                            });
                        }
                    }
                });
        }
    });
});
