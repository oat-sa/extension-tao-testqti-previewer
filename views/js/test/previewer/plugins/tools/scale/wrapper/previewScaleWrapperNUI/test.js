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
 * Copyright (c) 2026 Open Assessment Technologies SA
 */
define([
    'jquery',
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/wrapper/previewScaleWrapperNUI'
], function ($, scalePluginFactory) {
    'use strict';

    function createRunnerMock() {
        const handlers = {};

        function on(eventName, callback) {
            handlers[eventName] = handlers[eventName] || [];
            handlers[eventName].push(callback);
            return runner;
        }

        function trigger(eventName) {
            const args = Array.prototype.slice.call(arguments, 1);
            (handlers[eventName] || []).forEach(function (callback) {
                callback.apply(runner, args);
            });
            return runner;
        }

        const runner = {
            on,
            trigger,
            getConfig: function () {
                return { options: { readOnly: false } };
            },
            getHandlersCount: function (eventName) {
                return (handlers[eventName] || []).length;
            }
        };

        return runner;
    }

    QUnit.module('NUI Scale Wrapper');

    QUnit.test('init is idempotent', function (assert) {
        const runner = createRunnerMock();
        const plugin = scalePluginFactory(runner, {
            wrapper: '#fixture-wrapper',
            container: '#fixture-content'
        });

        assert.expect(2);
        plugin.init();
        plugin.init();

        assert.equal(runner.getHandlersCount('enablenav'), 1, 'enablenav handler is bound once');
        assert.equal(runner.getHandlersCount('disablenav'), 1, 'disablenav handler is bound once');
    });

    QUnit.test('render is idempotent for scale shell nodes', function (assert) {
        const ready = assert.async();
        const runner = createRunnerMock();
        const plugin = scalePluginFactory(runner, {
            wrapper: '#fixture-wrapper-2',
            container: '#fixture-content-2'
        });

        assert.expect(4);
        plugin.init();

        plugin.render()
            .then(function () {
                return plugin.render();
            })
            .then(function () {
                assert.equal($('#fixture-wrapper-2 > .scale-bar').length, 1, 'scale bar is not duplicated');
                assert.equal($('#fixture-wrapper-2 > .scale-preview').length, 1, 'scale preview host is not duplicated');
                assert.equal($('#fixture-wrapper-2 #fixture-content-2').length, 1, 'content exists only once');
                plugin.destroy();
                assert.equal($('#fixture-wrapper-2 > .scale-preview').length, 0, 'destroy removes preview host');
                ready();
            })
            .catch(function (err) {
                assert.ok(false, err && err.message ? err.message : 'render should not fail');
                ready();
            });
    });

    QUnit.test('render rejects when container cannot be resolved', function (assert) {
        const ready = assert.async();
        const runner = createRunnerMock();
        const plugin = scalePluginFactory(runner, {
            wrapper: '#fixture-wrapper-3',
            container: '#missing-container'
        });

        assert.expect(1);
        plugin.init();

        plugin.render()
            .then(function () {
                assert.ok(false, 'render should reject when container is missing');
                ready();
            })
            .catch(function (err) {
                assert.equal(
                    err.message,
                    '[scalePlugin] container element cannot be resolved',
                    'render fails with explicit missing-container error'
                );
                ready();
            });
    });
});
