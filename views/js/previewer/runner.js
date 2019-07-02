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
 * Component that embeds the QTI previewer for tests and items
 *
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'taoTests/runner/runnerComponent',
    'tpl!taoQtiTestPreviewer/previewer/runner'
], function (runnerComponentFactory, runnerTpl) {
    'use strict';

    /**
     * Builds a test runner to preview test item
     * @param {jQuery|HTMLElement|String} container - The container in which renders the component
     * @param {Object}   config - The testRunner options
     * @param {String}  [config.provider] - The provider to use
     * @param {Object[]} [config.providers] - A collection of providers to load.
     * @param {Boolean} [config.replace] - When the component is appended to its container, clears the place before
     * @param {Number|String} [config.width] - The width in pixels, or 'auto' to use the container's width
     * @param {Number|String} [config.height] - The height in pixels, or 'auto' to use the container's height
     * @param {Boolean} [config.options.fullPage] - Force the previewer to occupy the full window.
     * @param {Booleanh} [config.options.readOnly] - Do not allow to modify the previewed item.
     * @param {Function} [template] - An optional template for the component
     * @returns {previewer}
     */
    return function previewerFactory(container, config = {}, template = null) {

        return runnerComponentFactory(container, config, template || runnerTpl)
            .on('render', function() {
                const {fullPage, readOnly} = this.getConfig().options;
                this.setState('fullpage', fullPage);
                this.setState('readonly', readOnly);
            })
            .on('ready', function(runner) {
                runner.on('destroy', () => this.destroy() );
            });
    };
});
