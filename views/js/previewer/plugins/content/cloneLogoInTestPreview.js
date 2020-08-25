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
 * Test Previewer Content Plugin : cloneLogoInTestPreview
 *
 * This plugin can be used as a hook to clone logo from the header in the back office to the header in the test preview
 *
 * @author Hanna Dzmitryieva <hanna@taotesting.com>
 */
define(['jquery', 'taoTests/runner/plugin'], function ($, pluginFactory) {
    'use strict';

    return pluginFactory({
        name: 'cloneLogoInTestPreview',

        /**
         * Initialize the plugin (called during runner's init)
         */
        init() {
            const testRunner = this.getTestRunner();

            testRunner.after('ready', () => {
                // clone logo to preview - because logo source + class + styles can be customized by client extension
                $('#tao-main-logo').clone().appendTo('.previewer-component header');
            });
        }
    });
});
