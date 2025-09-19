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
 * Copyright (c) 2025 (original work) Open Assessment Technologies SA
 */

/**
 * Test Previewer Responsive Scale plugin wrapper : Scale
 */
define([
    'jquery',
    'lodash',
    'lib/uuid',
    'util/namespace',
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/component/devicesPreviewer',
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/component/devicesSelector',
    'css!taoQtiTestPreviewer/previewer/plugins/tools/scale/component/css/devicesSelector.css'
], function (
    $,
    _,
    uuid,
    namespaceHelper,
    devicesPreviewerFactory,
    devicesSelectorFactory
) {
    'use strict';

    /**
     * Functional factory that simulates a class instance.
     * Usage:
     *   var scale = scalePlugin(runner, { areaBroker: runner.getAreaBroker() });
     *   scale.init();
     *   scale.render();
     */
    function scalePlugin(runner, opts) {
        if (!runner) {
            throw new Error('[scalePlugin] runner is required');
        }

        const name = (opts && opts.name) || 'scale';
        const externalConfig = opts && opts.config;
        const areaBroker =
            (opts && opts.areaBroker) ||
            (typeof runner.getAreaBroker === 'function'
                ? runner.getAreaBroker()
                : null);

        const nsId = name + uuid(6);
        const state = { enabled: false, visible: false };

        let devicesSelector = null;
        let devicesPreviewer = null;

        function _getConfig() {
            if (externalConfig) return externalConfig;
            if (runner && typeof runner.getConfig === 'function') {
                return runner.getConfig();
            }
            return { options: { readOnly: false } };
        }

        function getState(key) {
            return key ? state[key] : state;
        }

        function setState(key, value) {
            state[key] = value;
            return api;
        }

        function init() {
            function isPluginAllowed() {
                const config = _getConfig();
                return !(config && config.options && config.options.readOnly);
            }

            if (!isPluginAllowed()) {
                api.hide();
            }

            api.disable();

            runner
                .on('render', function () {
                    if (isPluginAllowed()) {
                        api.show();
                    } else {
                        api.hide();
                    }
                })
                .on('resizeitem', function (size, orientation, type) {
                    if (devicesPreviewer) {
                        devicesPreviewer
                            .setDeviceType(type)
                            .setDeviceOrientation(orientation)
                            .setDeviceWidth(size && size.width)
                            .setDeviceHeight(size && size.height)
                            .previewDevice();
                    }
                })
                .on('enablenav', function () {
                    api.enable();
                })
                .on('disablenav', function () {
                    api.disable();
                });

            return api;
        }

        function render() {
            if (!areaBroker) {
                return Promise.reject(
                    new Error('[scalePlugin] areaBroker is required')
                );
            }

            function resizeItem() {
                if (devicesSelector && getState('enabled')) {
                    runner.trigger(
                        'resizeitem',
                        devicesSelector.getDeviceData(),
                        devicesSelector.getOrientation(),
                        devicesSelector.getType()
                    );
                }
            }

            $(window).on(
                namespaceHelper.namespaceAll('resize orientationchange', nsId),
                _.throttle(function () {
                    if (devicesSelector && devicesSelector.isDeviceMode()) {
                        resizeItem();
                    }
                }, 50)
            );

            const container = areaBroker.getContainer();
            const $scaleTool = $('<div class="scale-bar"></div>').appendTo(container);
            const $previewHost = $('<div class="scale-preview"></div>').appendTo(container);

            return Promise.all([
                new Promise(function (resolve) {
                    devicesSelector = devicesSelectorFactory($scaleTool).on(
                        'ready',
                        function () {
                            if (!getState('enabled')) {
                                this.disable();
                            }

                            this.on('typechange', function () {
                                if (!this.isDeviceMode()) {
                                    resizeItem();
                                }
                            });

                            this.on('devicechange orientationchange', function () {
                                resizeItem();
                            });

                            resolve();
                        }
                    );
                }),
                new Promise(function (resolve) {
                    devicesPreviewer = devicesPreviewerFactory($previewHost).on(
                        'ready',
                        function () {
                            this.wrap(areaBroker.getTestRunnerArea());
                            resolve();
                        }
                    );
                })
            ]);
        }

        function destroy() {
            if (nsId) {
                $(window).off('.' + nsId);
            }
            if (devicesSelector) {
                devicesSelector.destroy();
            }
            if (devicesPreviewer) {
                devicesPreviewer.destroy();
            }
            devicesSelector = null;
            devicesPreviewer = null;
            return api;
        }

        function enable() {
            setState('enabled', true);
            if (devicesSelector) devicesSelector.enable();
            return api;
        }

        function disable() {
            setState('enabled', false);
            if (devicesSelector) devicesSelector.disable();
            return api;
        }

        function show() {
            setState('visible', true);
            if (devicesSelector) devicesSelector.show();
            return api;
        }

        function hide() {
            setState('visible', false);
            if (devicesSelector) devicesSelector.hide();
            return api;
        }

        const api = {
            getName: () => name,
            init,
            render,
            destroy,
            enable,
            disable,
            show,
            hide,
            getState,
            setState
        };

        return api;
    }

    return scalePlugin;
});