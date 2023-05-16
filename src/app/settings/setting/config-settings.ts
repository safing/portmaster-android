import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, TrackByFunction, ViewChildren, ViewChild } from "@angular/core";
import { BehaviorSubject, Subscription, combineLatest } from "rxjs";
import { ConfigService } from "src/app/lib/config.service";
import { ExpertiseLevelNumber, Setting, releaseLevelFromName } from "src/app/lib/config.types";
import { GenericSettingComponent, SaveSettingEvent } from "./generic-setting/generic-setting";
import { StatusService } from "src/app/services/status.service";
import { Subsystem } from "src/app/services/status.types";
import { CommonModule } from "@angular/common";
import { IonicModule, IonModal } from "@ionic/angular";

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

  activeSection = '';
  activeCategory = '';
  loading = true;

  @ViewChild(IonModal) editModal: IonModal;
  editSetting: Setting;

  
  @Input()
  resetLabelText = 'Reset to system default';

  @Input()
  set compactView(v: any) {
    // this._compactView = coerceBooleanProperty(v);
  }
  get compactView() {
    return this._compactView
  }
  private _compactView = false;

  @Input()
  set lockDefaults(v: any) {
    // this._lockDefaults = coerceBooleanProperty(v);
  }
  get lockDefaults() {
    return this._lockDefaults;
  }
  private _lockDefaults = false;

  @Input()
  set userSettingsMarker(v: any) {
    // this._userSettingsMarker = coerceBooleanProperty(v);
  }
  get userSettingsMarker() { return this._userSettingsMarker }
  private _userSettingsMarker = true;

  @Input()
  set searchTerm(v: string) {
    this.onSearch.next(v);
  }

  @Input()
  set availableSettings(v: Setting[]) {
    this.onSettingsChange.next(v);
  }

  @Input()
  displayStackable: string | boolean = false;

  @Input()
  set highlightKey(key: string | null) {
    this._highlightKey = key || null;
    this._scrolledToHighlighted = false;
    // If we already loaded the settings then instruct the window
    // to scroll the setting into the view.
    if (!!key && !!this.settings && this.settings.size > 0) {
      this.scrollTo(key);
      this._scrolledToHighlighted = true;
    }
  }
  get highlightKey() {
    return this._highlightKey;
  }
  private _highlightKey: string | null = null;
  private _scrolledToHighlighted = false;


  // @Output()
  // save = new EventEmitter<SaveSettingEvent>();

  private onSearch = new BehaviorSubject<string>('');
  private onSettingsChange = new BehaviorSubject<Setting[]>([]);

  @ViewChildren('navLink', { read: ElementRef })
  navLinks: QueryList<ElementRef> | null = null;

  private subscription = Subscription.EMPTY;

  constructor(
    public statusService: StatusService,
    public configService: ConfigService,
    private elementRef: ElementRef,
    private changeDetectorRef: ChangeDetectorRef,
  ) { }

  saveSetting(event: SaveSettingEvent, s: Setting) {
    // this.save.next(event);
    const subsys = this.subsystems.find(subsys => s.Key === subsys.ToggleOptionKey)
    if (!!subsys) {
      // trigger a reload of the page as we now might need to show more
      // settings.
      this.onSettingsChange.next(this.onSettingsChange.getValue());
    }
  }

  trackSubsystem: TrackByFunction<SubsystemWithExpertise> = this.statusService.trackSubsystem;

  trackCategory(_: number, cat: Category) {
    return cat.name;
  }

  ngOnInit(): void {
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
          const currentReleaseLevelSetting = settings.find(s => s.Key === 'core/releaseLevel');
          const currentReleaseLevel = releaseLevelFromName(
            currentReleaseLevelSetting?.Value || currentReleaseLevelSetting?.DefaultValue || 'stable' as any
          );

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
          })

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

          console.log("Subsystems: ", JSON.stringify(this.subsystems));

          // Force the core subsystem to the end.
          if (this.subsystems.length >= 2 && this.subsystems[0].ID === "core") {
            this.subsystems.push(this.subsystems.shift() as SubsystemWithExpertise);
          }

          // // Notify the user interface that we're done loading
          // // the settings.
          this.loading = false;

          // If there's a highlightKey set and we have not yet scrolled
          // to it (because it was set during component bootstrap) we
          // need to scroll there now.
          if (this._highlightKey !== null && !this._scrolledToHighlighted) {
            this._scrolledToHighlighted = true;

            // Use the next animation frame for scrolling
            window.requestAnimationFrame(() => {
              this.scrollTo(this._highlightKey || '');
            })
          }
        }
      )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.onSearch.complete();
  }

  /**
   * Calculates which navigation entry should be highlighted
   * depending on the scroll position.
   */
  private intersectionCallback() {
    // search our parents for the element that's scrollable
    let elem: HTMLElement = this.elementRef.nativeElement;
    while (!!elem) {
      if (elem.scrollTop > 0) {
        break;
      }
      elem = elem.parentElement!;
    }

    // if there's no scrolled/scrollable parent element
    // our content itself is scrollable so use our own
    // host element as the anchor for the calculation.
    if (!elem) {
      elem = this.elementRef.nativeElement;
    }

    // get the elements offset to page-top
    var offsetTop = 0;
    if (!!elem) {
      const viewRect = elem.getBoundingClientRect();
      offsetTop = viewRect.top;
    }

    this.navLinks?.some(link => {
      const subsystem = link.nativeElement.getAttribute("subsystem");
      const category = link.nativeElement.getAttribute("category");


      const lastChild = (link.nativeElement as HTMLElement).lastElementChild as HTMLElement;
      if (!lastChild) {
        return false;
      }

      const rect = lastChild.getBoundingClientRect();
      const styleBox = getComputedStyle(lastChild);

      const offset = rect.top + rect.height - parseInt(styleBox.marginBottom) - parseInt(styleBox.paddingBottom);

      if (offset >= offsetTop) {
        this.activeSection = subsystem;
        this.activeCategory = category;
        return true;
      }

      return false;
    })
    this.changeDetectorRef.detectChanges();
  }

  /**
   * @private
   * Performs a smooth-scroll to the given anchor element ID.
   *
   * @param id The ID of the anchor element to scroll to.
   */
  scrollTo(id: string, cat?: Category) {
    if (!!cat) {
      cat.collapsed = false;
    }
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    })
  }

  openEditModal(event: {setting: Setting, index: number}) {
    console.log(JSON.stringify(event));
    this.editSetting = event.setting;
    this.editModal.present();
  }

  onEditModalDissmiss(event: any) {}

  cancel() {
    this.editModal.dismiss(null, 'cancel');
  }

  confirm() {
    this.editModal.dismiss(null, 'confirm');
  }
}
