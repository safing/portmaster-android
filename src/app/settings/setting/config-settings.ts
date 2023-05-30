import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, TrackByFunction, Output, EventEmitter } from "@angular/core";
import { BehaviorSubject, Subscription, combineLatest } from "rxjs";
import { ConfigService } from "src/app/lib/config.service";
import { ExpertiseLevelNumber, Setting, WellKnown } from "src/app/lib/config.types";
import { GenericSettingComponent, SaveSettingEvent } from "./generic-setting/generic-setting";
import { StatusService } from "src/app/services/status.service";
import { Subsystem } from "src/app/services/status.types";
import { CommonModule } from "@angular/common";
import { IonicModule, IonModal } from "@ionic/angular";
import { ShutdownService } from "src/app/services/shutdown.service";

interface Category {
  name: string;
  settings: Setting[];
  minimumExpertise: ExpertiseLevelNumber;
  collapsed: boolean;
  hasUserDefinedValues: boolean;
}

interface SubsystemWithExpertise extends Subsystem {
  minimumExpertise: ExpertiseLevelNumber;
  isDisabled: boolean;
  hasUserDefinedValues: boolean;
}

@Component({
  standalone: true,
  selector: 'app-settings-view',
  templateUrl: './config-settings.html',
  styleUrls: ['./config-settings.scss'],
  imports: [CommonModule, IonicModule, GenericSettingComponent]
})
export class ConfigSettingsViewComponent implements OnInit, OnDestroy {
  subsystems: SubsystemWithExpertise[] = [];
  others: Setting[] | null = null
  settings: Map<string, Category[]> = new Map();

  @Input()
  set availableSettings(v: Setting[]) {
    this.onSettingsChange.next(v);
  }

  @Input()
  highlightSettingKey: string | null = null;

  @Output()
  save = new EventEmitter<SaveSettingEvent>();

  private onSearch = new BehaviorSubject<string>('');
  private onSettingsChange = new BehaviorSubject<Setting[]>([]);

  restartPending: boolean = false;

  private subscription = Subscription.EMPTY;

  constructor(
    public statusService: StatusService,
    public configService: ConfigService,
    private shutdownService: ShutdownService,
    private changeDetectorRef: ChangeDetectorRef,
  ) { }

  saveSetting(event: SaveSettingEvent, s: Setting) {
    this.save.next(event);
    const subsys = this.subsystems.find(subsys => s.Key === subsys.ToggleOptionKey)
    if (!!subsys) {
      // trigger a reload of the page as we now might need to show more
      // settings.
      this.onSettingsChange.next(this.onSettingsChange.getValue());
    }

    this.changeDetectorRef.detectChanges();
  }

  trackSubsystem: TrackByFunction<SubsystemWithExpertise> = this.statusService.trackSubsystem;

  trackCategory(_: number, cat: Category) {
    return cat.name;
  }

  ngOnInit(): void {
    console.log("Init:", this.highlightSettingKey);
    this.subscription = combineLatest([
      this.onSettingsChange,
      this.statusService.querySubsystem(),
    ])
      .subscribe(
        ([settings, subsystems]) => {
          this.subsystems = subsystems.map(s => ({
            ...s,
            // we start with developer and decrease to the lowest number required
            // while grouping the settings.
            minimumExpertise: ExpertiseLevelNumber.developer,
            isDisabled: false,
            hasUserDefinedValues: false,
          }));
          this.others = [];
          this.settings = new Map();

          // Get the current release level as a number (fallback to 'stable' is something goes wrong)
          // const currentReleaseLevelSetting = settings.find(s => s.Key === 'core/releaseLevel');
          // const currentReleaseLevel = releaseLevelFromName(
          //   currentReleaseLevelSetting?.Value || currentReleaseLevelSetting?.DefaultValue || 'stable' as any
          // );

          // Make sure we only display settings that are allowed by the releaselevel setting.
          // settings = settings.filter(setting => setting.ReleaseLevel <= currentReleaseLevel);

          settings.forEach(setting => {
            let pushed = false;
            this.subsystems.forEach(subsys => {
              if (setting.Key.startsWith(subsys.ConfigKeySpace.slice("config:".length))) {

                // get the category name annotation and fallback to 'others'
                let catName = 'other';
                if (!!setting.Annotations && !!setting.Annotations["safing/portbase:ui:category"]) {
                  catName = setting.Annotations["safing/portbase:ui:category"]
                }

                // ensure we have a category array for the subsystem.
                let categories = this.settings.get(subsys.ConfigKeySpace);
                if (!categories) {
                  categories = [];
                  this.settings.set(subsys.ConfigKeySpace, categories);
                }

                // find or create the appropriate category object.
                let cat = categories.find(c => c.name === catName)
                if (!cat) {
                  cat = {
                    name: catName,
                    minimumExpertise: ExpertiseLevelNumber.developer,
                    settings: [],
                    collapsed: false,
                    hasUserDefinedValues: false,
                  }
                  categories.push(cat);
                }

                // add the setting to the category object and update
                // the minimum expertise required for the category.
                cat.settings.push(setting)
                if (setting.ExpertiseLevel < cat.minimumExpertise) {
                  cat.minimumExpertise = setting.ExpertiseLevel;
                }

                pushed = true;
              }
            })

            // if we did not push the setting to some subsystem
            // we need to push it to "others"
            if (!pushed) {
              this.others!.push(setting);
            }

            let restartPending = !!setting.Annotations?.[WellKnown.RestartPending];
            if (restartPending) {
              this.restartPending = true;
            }
          });

          if (this.others.length === 0) {
            this.others = null;
          }

          // Reduce the subsystem array to only contain subsystems that
          // actually have settings to show.
          // Also update the minimumExpertiseLevel for those subsystems
          this.subsystems = this.subsystems
            .filter(subsys => {
              return !!this.settings.get(subsys.ConfigKeySpace);
            })
            .map(subsys => {
              let categories = this.settings.get(subsys.ConfigKeySpace)!
              let hasUserDefinedValues = false;
              categories.forEach(c => {
                c.hasUserDefinedValues = c.settings.some(s => s.Value !== undefined)
                hasUserDefinedValues = c.hasUserDefinedValues || hasUserDefinedValues;
              });

              subsys.hasUserDefinedValues = hasUserDefinedValues;


              let toggleOption: Setting | undefined = undefined;
              for (let c of categories) {
                toggleOption = c.settings.find(s => s.Key === subsys.ToggleOptionKey)
                if (!!toggleOption) {
                  if (toggleOption.Value !== undefined && !toggleOption.Value || (toggleOption.Value === undefined && !toggleOption.DefaultValue)) {
                    subsys.isDisabled = true;

                    // remove all settings for all subsystem categories
                    // except for the ToggleOption.
                    categories = categories
                      .map(c => ({
                        ...c,
                        settings: c.settings.filter(s => s.Key === toggleOption!.Key),
                      }))
                      .filter(cat => cat.settings.length > 0)
                    this.settings.set(subsys.ConfigKeySpace, categories);
                  }
                  break;
                }
              }


              // reduce the categories to find the smallest expertise level requirement.
              subsys.minimumExpertise = categories.reduce((min, current) => {
                if (current.minimumExpertise < min) {
                  return current.minimumExpertise;
                }
                return min;
              }, ExpertiseLevelNumber.developer as ExpertiseLevelNumber);

              return subsys;
            })


          // Force the core subsystem to the end.
          if (this.subsystems.length >= 2 && this.subsystems[0].ID === "core") {
            this.subsystems.push(this.subsystems.shift() as SubsystemWithExpertise);
          }
        }
      )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.onSearch.complete();
  }

  promptRestart() {
    this.shutdownService.promptRestart();
  }
}
