import { ExtensionModule } from "./ExtensionModule";
import { RBKwebPageType } from "../Context/RBKwebPageType";
import { ConfigBuilder } from "../Configuration/ConfigBuilder";
import { ModuleConfiguration } from "../Configuration/ModuleConfiguration";
import { ModuleBase } from "./ModuleBase";

/**
 * EM_ThradTitleLinks - Extension module for RBKweb.
 */

export class ThreadTitleLinks extends ModuleBase {
    readonly name: string = "ThreadTitleLinks";

    pageTypesToRunOn: Array<RBKwebPageType> = [
        RBKwebPageType.RBKweb_FORUM_ALL
    ];

    configSpec = () =>
        ConfigBuilder
            .Define()
            .EnabledByDefault()
            .WithExtensionModuleName(this.name)
            .WithDisplayName(this.name)
            .WithDescription("Denne modulen gjør at linker for tråder med nytt innhold flytter deg til der de nye postene er.")
            .Build();

    execute = () => {
        var titleelts = document.querySelectorAll('span.topictitle a img[src*="icon_newest_reply.gif"]');
        titleelts.forEach(function(elt, key, parent) {
            var span = (elt as HTMLElement).closest("span.topictitle") as HTMLElement;
            var link = span.querySelector("a.topictitle") as HTMLAnchorElement;
            var url = link.href;
            var m;
            if ((m = url.match(/\bt=([0-9]*)\&highlight=$/)) || (m = url.match(/\bt=([0-9]*)$/))) {
                var topic = m[1];
                link.href = "viewtopic.php?t=" + topic + "&view=newest";
            }
        }.bind(this));
    }
};
